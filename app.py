from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

N = 5
actions = [(-1, 0), (1, 0), (0, -1), (0, 1)]  # up, down, left, right

def value_iteration(start, goal, obstacles, gamma=0.9, theta=1e-4):
    obstacles_set = set(tuple(o) for o in obstacles)
    V = np.zeros((N, N))
    policy = np.zeros((N, N), dtype=int)
    
    while True:
        delta = 0
        for i in range(N):
            for j in range(N):
                if (i, j) in obstacles_set or (i, j) == tuple(goal):
                    continue
                v = V[i, j]
                q_values = []
                for a, (di, dj) in enumerate(actions):
                    ni, nj = i + di, j + dj
                    if 0 <= ni < N and 0 <= nj < N and (ni, nj) not in obstacles_set:
                        reward = 1 if (ni, nj) == tuple(goal) else -0.01
                        q = reward + gamma * V[ni, nj]
                    else:
                        q = -0.01 + gamma * V[i, j]  # stay
                    q_values.append(q)
                V[i, j] = max(q_values)
                policy[i, j] = np.argmax(q_values)
                delta = max(delta, abs(v - V[i, j]))
        if delta < theta:
            break
    return V, policy

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compute', methods=['POST'])
def compute():
    data = request.json
    start = data['start']
    goal = data['goal']
    obstacles = data['obstacles']
    V, policy = value_iteration(start, goal, obstacles)
    return jsonify({'V': V.tolist(), 'policy': policy.tolist()})

if __name__ == '__main__':
    app.run(debug=True)