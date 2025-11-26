export function isValidColoring(coloredGraph) {
    const colorMap = new Map();
    
    for (const node of coloredGraph) {
        colorMap.set(node[0], node[1]);
    }
    
    for (const node of coloredGraph) {
        const [nodeId, color, neighbors] = node;
        
        for (const neighborId of neighbors) {
            const neighborColor = colorMap.get(neighborId);
            if (neighborColor === color) {
                return false;
            }
        }
    }
    
    return true;
}

export function countConflicts(coloredGraph) {
    const colorMap = new Map();
    let conflicts = 0;
    const countedPairs = new Set();
    
    for (const node of coloredGraph) {
        colorMap.set(node[0], node[1]);
    }
    
    for (const node of coloredGraph) {
        const [nodeId, color, neighbors] = node;
        
        for (const neighborId of neighbors) {
            const neighborColor = colorMap.get(neighborId);
            const pairKey = [nodeId, neighborId].sort().join('-');
            
            if (neighborColor === color && !countedPairs.has(pairKey)) {
                conflicts++;
                countedPairs.add(pairKey);
            }
        }
    }
    
    return conflicts;
}

export function generateRandomColoring(graph, k) {
    return graph.map(node => {
        const randomColor = Math.floor(Math.random() * k);
        return [node[0], randomColor, node[2]];
    });
}