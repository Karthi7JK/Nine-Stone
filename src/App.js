import './App.css';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { BoardConfig, BoardDetail, COUNT, Direction, GAME_DRIVER, MODE, PLAYER, SOLDIER_STATUS } from './Config';

function App() {

const driver = {...GAME_DRIVER}; 

const moveItem = () => {

    var teamBlue = document.getElementById('1');
    var teamRed = document.getElementById('7');
    var box = document.getElementById("100");

      var team1Rect = teamBlue.getBoundingClientRect();
      var team2Rect = teamRed.getBoundingClientRect();

      var rect = box.getBoundingClientRect();

      //gsap.set(box, {x: team1Rect.x, y: team1Rect.y});
      
        //gsap.to(team2Rect, 1, { backgroundColor: "red" });
      
      var newRect = box.getBoundingClientRect();

    //   gsap.from(box, 1, {
    //     x: team1Rect.left - team2Rect.left,
    //     y: team1Rect.top - team2Rect.top
    //   });
    var tl = gsap.timeline();
    tl.to(box, {x: team2Rect.x - team1Rect.x});
    
}

const moveSoldier = (currentEle, targetEle, elementPos) => {
    const soldier = document.getElementById(`${BoardDetail[elementPos].elementID}`);

    const currentBox = currentEle.getBoundingClientRect();
    const targetBox = targetEle.getBoundingClientRect();

    const xDiff = (currentBox.x - targetBox.x);
    const yDiff = (currentBox.y - targetBox.y);

    const direction = (xDiff === 0) ? Direction.VERTICAL : Direction.HORIZONTAL;

    const directionKey = direction === Direction.HORIZONTAL ? 'x':'y';

    const directionConfig = {
        [directionKey] : (targetBox[directionKey]-currentBox[directionKey])
    }

    const moveEle = gsap.timeline();
    moveEle.to(soldier, directionConfig);
}

const isBoxAvailable = (pos) => {
    return !BoardDetail[pos].isOccupied;
}

const checkPlaceEligibility = (pos) => {
    return (pos>=1 && pos<=24 && isBoxAvailable(pos));        
}

const checkBoxEligibility = (pos) => {
    return (pos>=1 && pos<=24)
}

const isMovementPossible = (pos) => {

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

const handlePlayMode = (pos, event) => {
    if(checkBoxEligibility(pos) && isMovementPossible(pos)) {
        setCurrentActiveSoldier(pos,event);
        switchGameMode(MODE.MOVE);
    }
}

const setCurrentActiveSoldier = (pos, event) => {
    const {currentPlayer} = driver.players;
    driver.players[currentPlayer].currentSoldier =  {...driver.players[currentPlayer].SOLDIERS[pos], pos:pos, element:event.currentTarget}
}

const handleMoveMode = (pos, event) => {
    const {currentPlayer} = driver.players;
    const currentEle = driver.players[currentPlayer].currentSoldier.element; 
    const currentSoldierPos = driver.players[currentPlayer].currentSoldier.pos;
    const targetEle = event.currentTarget;
    moveSoldier(currentEle, targetEle, currentSoldierPos);
    switchGameMode(MODE.PLAY);
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
    
    BoardDetail[pos].isOccupied = true;
    BoardDetail[pos].PLAYER = driver.players.currentPlayer;  
    BoardDetail[pos].pos = driver.players[currentPlayer].count.onBoardedSoldiers-1;
    BoardDetail[pos].elementID = `${currentPlayer}-${BoardDetail[pos].pos}`;
    console.log('Position : ', BoardDetail[pos]);
}

const onBoardSoldiers = () => {
    const {currentPlayer} = driver.players;
    driver.players[currentPlayer].count.onBoardedSoldiers++;
}

const placeSoldierOnBoard = (pos, event) => {
    const soldier = document.createElement('div');
    const {currentPlayer} = driver.players;
    const onBoardCount = driver.players[currentPlayer].count.onBoardedSoldiers;
    const config = driver.players[currentPlayer].SOLDIERS[onBoardCount];
    config.STATUS = SOLDIER_STATUS.ACTIVE;
    config.position = pos;
    soldier.setAttribute("id", `${currentPlayer}-${onBoardCount}`);
    soldier.classList.add('soldier');
    soldier.style.background = `${config.bgColor}`;
    console.log(config.bgColor);
    event.target.appendChild(soldier);
}

const togglePlayer = () => {
    driver.players.currentPlayer = (driver.players.currentPlayer === PLAYER.A) ? PLAYER.B : PLAYER.A;
}

const onBoxClick = (pos, event) => {
    console.log('Position : ',pos);
    switch(driver.mode) {
        case MODE.ASSESMBLE:
            handleAssesmbleMode(pos, event);
            break;
        case MODE.PLAY:
            handlePlayMode(pos, event);
            break;
        case MODE.MOVE:
            handleMoveMode(pos, event);
            break;
    }

    if(checkPlaceEligibility(pos)) {

    }
}

const getBox = (data)=> {
  if(data.data === 1)
        return <div onClick={(event) => { onBoxClick(data.index, event) }} id={data.itr} className={data.style} key={data.itr}> {data.index} </div>
  else if(data.style === "box horLine" || data.style === "box verLine")
        return <><div onClick={(event) => { onBoxClick(data.index, event) }} id={data.itr} className={data.style} key={data.itr}> 
                  <div className="child">{data.itr}</div>
                  </div>
                </>
  return <div onClick={(event) => { onBoxClick(data.index, event) }} id={data.itr} className={data.style} key={data.itr}> {data.itr}</div>
}

useEffect(() => {
}, []); 

  return (
    <div className="App">
        <div className="container">
            {BoardConfig.map(data => {
             return getBox(data);
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
