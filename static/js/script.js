const N = 5;
let grid = [];
let start = [0, 0];
let goal = [4, 4];
let obstacles = [[1, 1], [2, 2], [3, 3]];
let V = null;
let policy = null;
const arrows = ['↑', '↓', '←', '→'];

function initGrid() {
    const gridDiv = document.getElementById('grid');
    gridDiv.innerHTML = '';
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.i = i;
            cell.dataset.j = j;
            cell.onmousedown = (e) => handleClick(e, i, j);
            cell.ondblclick = (e) => setGoal(i, j);
            gridDiv.appendChild(cell);
        }
    }
    updateGrid();
}

function handleClick(e, i, j) {
    e.preventDefault();
    if (e.button === 0) { // left click only
        if (i === start[0] && j === start[1]) {
            // Clicked on start, clear start (set to default or allow setting goal)
            start = [-1, -1]; // Clear start
            updateGrid();
        } else if (i === goal[0] && j === goal[1]) {
            // Clicked on goal, clear goal
            goal = [-1, -1]; // Clear goal
            updateGrid();
        } else if (obstacles.some(o => o[0] === i && o[1] === j)) {
            // Clicked on obstacle, remove it
            toggleObstacle(i, j);
        } else {
            // Clicked on empty cell
            if (start[0] === -1) {
                // No start set, set start
                setStart(i, j);
            } else if (goal[0] === -1) {
                // Start set but no goal, set goal
                setGoal(i, j);
            } else {
                // Both start and goal set, toggle obstacle
                toggleObstacle(i, j);
            }
        }
    }
}

function toggleObstacle(i, j) {
    if ((i === start[0] && j === start[1]) || (i === goal[0] && j === goal[1])) return;
    const idx = obstacles.findIndex(o => o[0] === i && o[1] === j);
    if (idx === -1) {
        obstacles.push([i, j]);
    } else {
        obstacles.splice(idx, 1);
    }
    updateGrid();
}

function setStart(i, j) {
    if ((i === goal[0] && j === goal[1]) || obstacles.some(o => o[0] === i && o[1] === j)) return;
    start = [i, j];
    updateGrid();
}

function setGoal(i, j) {
    if ((i === start[0] && j === start[1]) || obstacles.some(o => o[0] === i && o[1] === j)) return;
    goal = [i, j];
    updateGrid();
}

function getPath() {
    if (!policy || !Array.isArray(policy) || start[0] === -1 || goal[0] === -1) return []; // 確保 policy 是陣列且起點終點已設置
    const path = [];
    let current = [start[0], start[1]];
    const visited = new Set();
    const maxSteps = N * N;
    let steps = 0;

    const actions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 確保這裡有定義

    while (steps < maxSteps) {
        const key = `${current[0]},${current[1]}`;
        if (visited.has(key)) break;
        visited.add(key);
        path.push([current[0], current[1]]);

        if (current[0] === goal[0] && current[1] === goal[1]) break;

        const action = policy[current[0]][current[1]];
        if (action === undefined || action === null) break;

        const move = actions[action];
        current[0] += move[0];
        current[1] += move[1];

        if (current[0] < 0 || current[0] >= N || current[1] < 0 || current[1] >= N) break;
        steps++;
    }
    return path;
}

function updateGrid() {
    const path = getPath();
    document.querySelectorAll('.cell').forEach(cell => {
        const i = parseInt(cell.dataset.i);
        const j = parseInt(cell.dataset.j);
        cell.className = 'cell';
        cell.innerHTML = '';
        if (start[0] !== -1 && i === start[0] && j === start[1]) {
            cell.classList.add('start');
            cell.textContent = 'S';
        } else if (goal[0] !== -1 && i === goal[0] && j === goal[1]) {
            cell.classList.add('goal');
            cell.textContent = 'G';
        } else if (obstacles.some(o => o[0] === i && o[1] === j)) {
            cell.classList.add('obstacle');
        } else {
            if (V && policy) {
                const arrow = document.createElement('div');
                arrow.className = 'arrow';
                arrow.textContent = arrows[policy[i][j]];
                cell.appendChild(arrow);
                const value = document.createElement('div');
                value.className = 'value';
                value.textContent = V[i][j].toFixed(2);
                cell.appendChild(value);
            }
            // Check if this cell is on the path
            if (path.some(p => p[0] === i && p[1] === j)) {
                cell.classList.add('path');
            }
        }
    });
}

document.getElementById('compute').onclick = async () => {
    const response = await fetch('/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, goal, obstacles })
    });
    const data = await response.json();
    V = data.V;
    policy = data.policy;
    updateGrid();
};

document.addEventListener('contextmenu', e => e.preventDefault()); // disable right click menu

initGrid();