'use strict'



const MINE = '💣'
const FLAG = '🏴‍☠️'
const HINT = '☀️'
const TAKEN_HINT = '🌞'


var gBoard
var gEmptyCellsIdx
var gMinedCellsIdx
var gShownMines
var gIntervalId
var gTimeOutId


var gLevel = {
    SIZE: 4,
    MINES: 2
}


var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    flagsCount: 0,
    livesCount: 3,
    secsPassed: 0,
    steps: [],
    firstClick: false,
    hintMode: false
}



function onGameInit() {
    if (gIntervalId) clearInterval(gIntervalId)
    if (gTimeOutId) clearTimeout(gTimeOutId)
    gIntervalId = null
    gGame.markedCount = 0
    gGame.shownCount = 0
    gShownMines = 0
    gGame.steps = []
    gEmptyCellsIdx = []
    gMinedCellsIdx = []
    gGame.firstClick = false
    gGame.isOn = true
    gGame.hintMode = false
    gGame.flagsCount = gLevel.MINES,
        gGame.livesCount = (gLevel.SIZE === 4) ? 2 : 3
    gBoard = buildBoard(gLevel.SIZE, gLevel.SIZE)
    findEmptyCells(gBoard)
    renderLife()
    renderTimeZero()
    renderBoard(gBoard)
    renderSmily('normal')
    renderFlagsCount()
    renderHints(3)
}

function createDifficultyLevel(level = 'Easy') {
    switch (level) {
        case 1:
            gLevel.SIZE = 4
            gLevel.MINES = 2
            gGame.livesCount = 2
            break;
        case 2:
            gLevel.SIZE = 8
            gLevel.MINES = 14
            gGame.livesCount = 3
            break;
        case 3:
            gLevel.SIZE = 12
            gLevel.MINES = 32
            gGame.livesCount = 3
    }
    // console.log('g:', gBoard)
    clearInterval(gIntervalId)
    onGameInit()
}

// 1. Create a 4x4 gBoard Matrix containing Objects. Place 2 mines
// manually when each cell’s isShown set to true.
// 2. Present the mines using renderBoard() function.

function buildBoard(ROWS, COLS) {
    const mat = []

    for (var i = 0; i < ROWS; i++) {
        mat[i] = []
        for (var j = 0; j < COLS; j++) {
            const cell = {
                minesAroundCount: null,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            mat[i].push(cell)
        }
    }
    return mat
}

function findEmptyCells(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const cell = gBoard[i][j]
            if (!cell.isMine && !cell.isShown) gEmptyCellsIdx.push({ i, j })
        }
    }
}


function renderBoard(board) {
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]
            var img = ''
            strHTML += `<td class="cell-${i}-${j}" onclick="onCellClicked(this,${i}, ${j})" oncontextmenu= "cellMarked(this,${i},${j})">${img}</td>`
        }
        strHTML += '</tr>'
    }
    const elBoard = document.querySelector('tbody')
    elBoard.innerHTML = strHTML
}

function renderSmily(value) {
    const elSmily = document.querySelector('.smily')
    switch (value) {
        case 'normal':
            elSmily.innerText = '🐵'
            break
        case 'lose':
            elSmily.innerText = '🙊'
            break
        case 'win':
            elSmily.innerText = '🤩'
    }

}

function renderFlagsCount() {

    const elCount = document.querySelector('.flags-count')
    elCount.innerText = `🏴‍☠️  ${gGame.flagsCount}`
}

function renderHints(hintsCount) {
    const elhints = document.querySelector('.hints')
    var strHTML = ''
    for (var i = 0; i < hintsCount; i++) {
        strHTML += `<span onclick="takeHint(this)">${HINT}</span>`
    }
    console.log('html:', strHTML)
    elhints.innerHTML = strHTML
}



function onCellClicked(elCell, i, j) {
    // console.log('hint:',gGame.hintMode)
    const cell = gBoard[i][j]
    if (!gGame.isOn) return
    if (!gGame.hintMode) {
        if (cell.isMarked) return
        if (!cell.isShown) {
            gGame.steps.push({ i, j })
            cell.isShown = true
            if (!gMinedCellsIdx.length) {
                setMines(i, j)
                setMinesNegsCount()
                if (!gIntervalId) startTimer()
            }
            if (cell.isMine) {
                gShownMines++
                elCell.style.backgroundColor = '#d95151'
                elCell.innerText = MINE
                takeLife()
            } else if (cell.minesAroundCount) {
                gGame.shownCount++
                elCell.innerText = cell.minesAroundCount
                elCell.style.backgroundColor = 'white'
            } else {
                gGame.shownCount++
                elCell.style.backgroundColor = 'white'
                expandShown(gBoard, i, j)
            }
        }
        checkGameOver()
    } else {
        if (cell.isShown) revealNegs(i, j)
    }
    // console.log('time:', gGame.secsPassed)
}


function setMines(excludedI, excludedJ) {
    var excludedCellIdx
    for (var i = 0; i < gEmptyCellsIdx.length; i++) {
        if (gEmptyCellsIdx[i].i === excludedI && gEmptyCellsIdx[i].j === excludedJ) {
            excludedCellIdx = gEmptyCellsIdx[i]
            gEmptyCellsIdx.splice(i, 1)
        }
    }
    console.log(' gLevel.MINES:', gLevel.MINES)
    for (var i = 0; i < gLevel.MINES; i++) {
        const randomCellIdx = drawNum(gEmptyCellsIdx)
        gBoard[randomCellIdx.i][randomCellIdx.j].isMine = true
        gMinedCellsIdx.push(randomCellIdx)

    }
    console.log('mined:', gMinedCellsIdx)
    if (excludedCellIdx) gEmptyCellsIdx.push(excludedCellIdx)
}

function setMinesNegsCount() {
    for (var i = 0; i < gEmptyCellsIdx.length; i++) {
        const cellPosI = gEmptyCellsIdx[i].i
        const cellPosJ = gEmptyCellsIdx[i].j
        gBoard[cellPosI][cellPosJ].minesAroundCount = countMinedNeighbors(cellPosI, cellPosJ, gBoard)
    }
}

function countMinedNeighbors(cellI, cellJ, mat) {
    var neighborsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue

        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= mat[i].length) continue

            if (mat[i][j].isMine) neighborsCount++

        }
    }
    return neighborsCount
}

function takeLife() {
    gGame.livesCount--

    checkGameOver()
    renderLife()
}

function renderLife() {
    const elLife = document.querySelector('.life')
    elLife.innerHTML = `You have ${gGame.livesCount} lifes`
}

function checkGameOver() {
    if (!gGame.livesCount) lose()
    if (gGame.shownCount === gEmptyCellsIdx.length && (gGame.markedCount + gShownMines) === gMinedCellsIdx.length) victory()
}

function lose() {
    gGame.isOn = false
    clearInterval(gIntervalId)
    for (var i = 0; i < gMinedCellsIdx.length; i++) {
        const cellI = gMinedCellsIdx[i].i
        const cellJ = gMinedCellsIdx[i].j
        gBoard[cellI][cellJ].isShown = true
        const elCell = document.querySelector(`.cell-${cellI}-${cellJ}`)
        elCell.innerText = MINE
        elCell.style.backgroundColor = 'gray'
        // }
    }
    clearInterval(gIntervalId)
    renderSmily('lose')
}

function victory() {
    gGame.isOn = false
    renderSmily('win')
    clearInterval(gIntervalId)
}


function cellMarked(elCell, i, j) {
    if (gBoard[i][j].isShown) return
    gGame.steps.push({ i, j })
    if (gGame.steps.length === 1) {
        if (!gIntervalId) startTimer()
    }
    if (!gBoard[i][j].isMarked) {
        if (!gGame.flagsCount) return
        gGame.flagsCount--
        gGame.markedCount++
        gBoard[i][j].isMarked = true
    } else {
        if (gGame.flagsCount === gLevel.MINES) return
        gGame.flagsCount++
        gGame.markedCount--
        gBoard[i][j].isMarked = false
    }

    console.log('marked:', gGame.markedCount)
    renderFlagsCount()
    elCell.innerText = (gBoard[i][j].isMarked) ? FLAG : null

    checkGameOver()
}


function expandShown(board, clickedCellI, clickedCellJ) {

    for (var i = 0; i < gEmptyCellsIdx.length; i++) {
        const emptyCellI = gEmptyCellsIdx[i].i
        const emptyCellJ = gEmptyCellsIdx[i].j

        if ((emptyCellI >= clickedCellI - 1 && emptyCellI <= clickedCellI + 1) && (emptyCellJ >= clickedCellJ - 1 && emptyCellJ <= clickedCellJ + 1)) {
            const cell = board[emptyCellI][emptyCellJ]
            if (!cell.isMarked) {
                if (!cell.isShown) gGame.shownCount++
                cell.isShown = true
                const elCell = document.querySelector(`.cell-${emptyCellI}-${emptyCellJ}`)
                elCell.style.backgroundColor = 'white'
                if (cell.minesAroundCount) elCell.innerText = cell.minesAroundCount
            }
            //     for (var i = 0; i < gEmptyCellsIdx.length; i++) {
            //     expandShown(gBoard,emptyCellI,emptyCellJ)
            // }
        }
    }
}


function takeHint(elHint) {
    if (!gGame.steps.length) return
    gGame.hintMode = true
    elHint.innerText = TAKEN_HINT
    elHint.onclick = function () {
        return false;
    }
}


function revealNegs(cellI, cellJ) {
    if (gTimeOutId) clearTimeout(gTimeOutId)
    if (!gBoard[cellI][cellJ].isShown || gBoard[cellI][cellJ].isMine) return
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue

        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue
            const cell = gBoard[i][j]
            const elCell = document.querySelector(`.cell-${i}-${j}`)
            console.log('elcell:', elCell)
            if (cell.isMine) elCell.innerText = MINE

        }
    }
    gTimeOutId = setTimeout(hideNegs, 1000, cellI, cellJ)
}


function hideNegs(cellI, cellJ) {
    gGame.hintMode = false
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue

        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue
            const cell = gBoard[i][j]
            const elCell = document.querySelector(`.cell-${i}-${j}`)
            if (cell.isMine && !cell.isShown) elCell.innerText = null

        }
    }

}

// Keep the best score in local storage (per level) and show it on
// the page
