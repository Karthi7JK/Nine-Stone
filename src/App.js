import './App.css';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { BoardConfig, BoardDetail, COUNT, Direction, GAME_DRIVER, MODE, PLAYER, SOLDIER_STATUS } from './Config';

function App() {

const driver = {...GAME_DRIVER}; 
const BoardDetailData = new Map([...BoardDetail].map(node => [node.pos, node]));
const soldierMap = new Map();
const itrData = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];


const moveSoldier = (currentEle, targetEle, elementPos) => {
    const soldierId = `${BoardDetailData.get(elementPos).elementID}`;
    const soldier = document.getElementById(soldierId);

    const currentBox = currentEle.getBoundingClientRect();
    const targetBox = targetEle.getBoundingClientRect();

    const xDiff = (currentBox.x - targetBox.x);
    const yDiff = (currentBox.y - targetBox.y);

    const direction = (xDiff === 0) ? Direction.VERTICAL : Direction.HORIZONTAL;

    const directionKey = direction === Direction.HORIZONTAL ? 'x':'y';

    const distance = (targetBox[directionKey]-currentBox[directionKey]);


    console.log('Details : ',currentBox, targetBox, xDiff, yDiff, direction, distance)

    const directionConfig = {
        [directionKey] : distance //distance > 0 ? distance : 0
    }
    console.log('move data : ', soldier, directionConfig);
    soldier.style.trasnform = '';
    //const moveEle = gsap.timeline();
    //moveEle.to(soldier, directionConfig);

    let soldierConfig = soldierMap.get(soldierId);
    
    if(!soldierConfig) {
        soldierConfig = {
            [directionKey]:directionConfig[directionKey]
        }
        soldierMap.set(soldierId,soldierConfig);
        console.log('Soldier Config 1 : ', soldierConfig);
    }
    else {
        const val = soldierConfig[directionKey];
        soldierConfig[directionKey] = val ? val+directionConfig[directionKey]:directionConfig[directionKey];
        console.log('Soldier Config 2 : ', soldierConfig, directionKey);
    }

    directionConfig[directionKey] = soldierConfig[directionKey];

    console.log('Soldier Config 3 : ', soldierConfig, directionKey);

    var tween = gsap.to(`#${soldier.getAttribute('id')}`, {
        ...directionConfig,
        rotation: 360, 
        ease: "none", 
        paused: true
      });
      
      tween.play();
}

const isBoxAvailable = (pos) => {
    return !BoardDetailData.get(pos).isOccupied;
}

const checkPlaceEligibility = (pos) => {
    return (pos>=1 && pos<=24 && isBoxAvailable(pos));        
}

const isBoxAvailableForMove = (pos) => {
    const {currentPlayer} = driver.players;
    const selectedBox = BoardDetailData.get(pos);
    const direction = ['left','right','top','bottom'];
    return direction.some(cDirection => {
        const node = BoardDetailData.get(selectedBox.direction[cDirection]);
        if(node && !node.isOccupied && node.PLAYER !== currentPlayer) {
            return true;
        }
        return false;
    });
}

const checkForMatch = (pos) => {
    const {currentPlayer} = driver.players;
    const selectedBox = BoardDetailData.get(pos);

    let isMatchFound = false;
    let matchNodes = null;

    selectedBox.matchNodes.map(nodes => {
        let matchCount = 0;
        nodes.forEach(nPos => {
            const cNode = BoardDetailData.get(nPos);
            if(cNode.isOccupied && cNode.PLAYER === currentPlayer) {
                matchCount++;
            }
        });
        if(matchCount === 3) {
            isMatchFound = true;
            matchNodes = nodes;
        }
    });
    return {isMatchFound,matchNodes};
}

const isSelectedBoxValid = (pos) => {
    console.log('isMovementPossible \n Position : ', pos, 'isOccupied : ', BoardDetailData.get(pos).isOccupied);
    console.log(BoardDetailData);
    const {currentPlayer} = driver.players;
    const selectedBox = BoardDetailData.get(pos);
    return selectedBox.isOccupied && selectedBox.PLAYER === currentPlayer &&  (pos>=1 && pos<=24);
}

const handleAssesmbleMode = (pos, event) => { 
    if(checkPlaceEligibility(pos)) {
        placeSoldierOnBoard(pos, event);
        onBoardSoldiers();
        markBoxOccupancy(pos);
        togglePlayer();
        if(isAllSoldiersAssembled()) {
            switchGameMode(MODE.PLAY);
        }
    }
}

const handlePlayMode = (pos, event, data) => {
    if(isSelectedBoxValid(pos) && isBoxAvailableForMove(pos)) {
        setCurrentActiveSoldier(pos,event, data);
        addHighlightToCurrentSoldier();
        switchGameMode(MODE.MOVE);
    }
}

const removeCutHightlight = () => {
    for(let itr = 1; itr<=24; itr++) {
        let soldier = BoardDetailData.get(itr);
        const targetEle = document.getElementById(soldier.parentPos);
        targetEle.classList.remove('cutHighlight');
        targetEle.classList.remove('rotateAnim');
    }
}

const handleCutMode = (pos, event, data) => {
    console.log('Cut Mode');
    const {currentPlayer} = driver.players;
    const oppositePlayer = currentPlayer === 'A' ? 'B' : 'A';
    driver.players[oppositePlayer].count.activeSoldiers--;
    driver.players[oppositePlayer].count.deadSoldiers++;

    const cPos = BoardDetailData.get(data.index).elementID;
    let soldierBoxToCut = BoardDetailData.get(pos);
    soldierBoxToCut.PLAYER = "NONE";
    soldierBoxToCut.isOccupied = false;
    soldierBoxToCut.elementID = "";
    let soldierToCut = document.getElementById(cPos);
    soldierToCut.remove();
    removeCutHightlight();
    togglePlayer();
    switchGameMode(MODE.PLAY);
}


const addHighlightToCurrentSoldier = () => {
    const {currentPlayer} = driver.players;
    driver.players[currentPlayer].currentSoldier.element.classList.add('rotateAnim');
}

const removeHighlightToCurrentSoldier = () => {
    const {currentPlayer} = driver.players;
    driver.players[currentPlayer].currentSoldier.element.classList.remove('rotateAnim');
}

const setCurrentActiveSoldier = (pos, event, data) => {
    const {currentPlayer} = driver.players;
    //const cPos = +event.target.children[0].getAttribute("id").split("-")[1];
    const cPos = +BoardDetailData.get(data.index).elementID.split("-")[1];
    driver.players[currentPlayer].currentSoldier =  {...driver.players[currentPlayer].SOLDIERS[cPos], pos:pos, element:event.currentTarget, data:data}
    
}

const setPotentialSoldiersForCut = () => {
    const {currentPlayer} = driver.players;
    const oppositePlayer = currentPlayer === 'A' ? 'B' : 'A';
    for(let itr = 1; itr<=24; itr++) {
        let soldier = BoardDetailData.get(itr);
        if(soldier.PLAYER === oppositePlayer) {
            const targetEle = document.getElementById(soldier.parentPos);
            targetEle.classList.add('cutHighlight');
        }
    }
}

const handleMoveMode = (pos, event, data) => {
    const {currentPlayer} = driver.players;
    removeHighlightToCurrentSoldier();
    const currentEleIds = driver.players[currentPlayer].currentSoldier.data;
    const currentEle = document.getElementById(currentEleIds.itr); 
    const currentSoldierPos = driver.players[currentPlayer].currentSoldier.pos;
    const targetEle = document.getElementById(data.itr);//event.currentTarget;
    console.log('Move : ', currentEle, targetEle, currentSoldierPos);
    moveSoldier(currentEle, targetEle, currentSoldierPos);

    const cItem = BoardDetailData.get(currentEleIds.index);
    const tItem = BoardDetailData.get(data.index);
    cItem.isOccupied = false;
    cItem.PLAYER = PLAYER.NONE;
    tItem.elementID = cItem.elementID;
    tItem.isOccupied = true;
    tItem.PLAYER = currentPlayer;
    cItem.elementID = "";

    let {isMatchFound,matchNodes} = checkForMatch(pos);
    if(isMatchFound) {
        setTimeout(_ => {
            matchNodes.map(nPos => {
                let cNode = BoardDetailData.get(nPos);
                let soldier = document.getElementById(cNode.parentPos);
                soldier && soldier.classList.add('rotateAnim');
                cNode.isInMatch = true;
            });
            setPotentialSoldiersForCut();
        },1000);
        switchGameMode(MODE.CUT);
    }
    else {
        togglePlayer();
        switchGameMode(MODE.PLAY);
    }
    
}

const switchGameMode = (mode) => {
    driver.mode = mode;
}

const isAllSoldiersAssembled = () => {
    const totalSoldiersOnBoard = driver.players["A"].count.onBoardedSoldiers + driver.players["B"].count.onBoardedSoldiers;;
    return totalSoldiersOnBoard === COUNT.TOTAL * 2;
}

const markBoxOccupancy = (pos)=> {
    const {currentPlayer} = driver.players;
    const onBoardCount = driver.players[currentPlayer].count.onBoardedSoldiers;

    const ele = BoardDetailData.get(pos);
    ele.isOccupied = true;
    ele.PLAYER = driver.players.currentPlayer;  
    //BoardDetailData[pos].pos = driver.players[currentPlayer].count.onBoardedSoldiers-1;
    ele.elementID = `${currentPlayer}-${onBoardCount-1}`;
    console.log('Position : ', ele);
}

const onBoardSoldiers = () => {
    const {currentPlayer} = driver.players;
    driver.players[currentPlayer].count.onBoardedSoldiers++;
    driver.players[currentPlayer].count.activeSoldiers++;
}

const placeSoldierOnBoard = (pos, event) => {
    const soldier = document.createElement('div');
    const {currentPlayer} = driver.players;
    const onBoardCount = driver.players[currentPlayer].count.onBoardedSoldiers;
    const config = driver.players[currentPlayer].SOLDIERS[onBoardCount];
    config.STATUS = SOLDIER_STATUS.ACTIVE;
    config.position = pos;
    const soldierId = `${currentPlayer}-${onBoardCount}`;
    soldier.setAttribute("id", soldierId);
    ['soldier', 'noClick'].map(className => soldier.classList.add(className));
    soldier.classList.add(config.bgColor === 'white' ? 'hgWhite' : 'hgBlack');
    console.log(config.bgColor);
    soldierMap.set(soldierId, null);
    event.target.appendChild(soldier);
}

const togglePlayer = () => {
    driver.players.currentPlayer = (driver.players.currentPlayer === PLAYER.A) ? PLAYER.B : PLAYER.A;
}

const onBoxClick = (pos, event, data) => {
    console.log('Position : ',pos, data, driver.mode);
    switch(driver.mode) {
        case MODE.ASSESMBLE:
            handleAssesmbleMode(pos, event);
            break;
        case MODE.PLAY:
            handlePlayMode(pos, event, data);
            break;
        case MODE.MOVE:
            handleMoveMode(pos, event, data);
            break;
        case MODE.CUT: 
            handleCutMode(pos, event, data);
            break;
    }

    if(checkPlaceEligibility(pos)) {

    }
}

const getBox = (data)=> {
  if(data.data === 1)
        return <div onClick={(event) => { onBoxClick(data.index, event, data) }} id={data.itr} className={data.style} key={data.itr}> {data.index}</div>
  else if(data.style === "box horLine" || data.style === "box verLine")
        return <><div id={data.itr} className={data.style} key={data.itr}>
                  <div className="child noClick"></div>
                        
                  </div>
                </>
  return <div onClick={(event) => { onBoxClick(data.index, event, data) }} id={data.itr} className={data.style} key={data.itr}> </div>
}

useEffect(() => {
}, []); 

  return (
    <div className="App">
        <div className="container">
            {BoardConfig.map(data => {
             return <>
                {getBox(data)}
             </>
            })}
        </div>
    </div>
  );
}



export default App;


/*


var teamBlue = document.querySelector('.blue');
var teamRed = document.querySelector('.red');
var box = document.querySelector(".box");

teamBlue.addEventListener("click", changeTeam);
teamRed.addEventListener("click", changeTeam);

function changeTeam() {
  var rect = box.getBoundingClientRect();
  var classes = this.classList;
  this.appendChild(box);
  
  TweenMax.set(box, {x: 0, y: 0});
  
  if(classes.contains('red')){
    TweenMax.to(box, 1, { backgroundColor: "red" });
  } else if(classes.contains('blue')){
    TweenMax.to(box, 1, { backgroundColor: "blue" });
  }
  
  var newRect = box.getBoundingClientRect();

  TweenMax.from(box, 1, {
    x: rect.left - newRect.left,
    y: rect.top - newRect.top,
    ease: Power3.easeOut
  });
}


*/
