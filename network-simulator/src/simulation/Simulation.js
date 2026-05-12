/**
 * Simulation class managing the network simulation
 * Handles nodes, packets, movement, neighbor updates, and routing
 */
export class Simulation {
  /**
   * Create a network simulation
   * @param {Object} [options] - Simulation options
   * @param {number} [options.width=800] - Width of simulation area
   * @param {number} [options.height=600] - Height of simulation area
   */
  constructor(options = {}) {
    this.nodes = new Map(); // Map of node ID to Node instance
    this.packets = new Map(); // Map of packet ID to Packet instance
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.time = 0; // Simulation time in milliseconds
    this.isRunning = false;
    this.animationFrameId = null;
  }

  /**
   * Add a node to the simulation
   * @param {Node} node - Node to add
   * @returns {boolean} True if node was added
   */
  addNode(node) {
    if (!(node instanceof Node)) {
      throw new Error('Only Node instances can be added to simulation');
    }
    
    if (this.nodes.has(node.id)) {
      return false; // Node already exists
    }
    
    this.nodes.set(node.id, node);
    this._updateAllNeighbors(); // Update neighbors for all nodes
    return true;
  }

  /**
   * Remove a node from the simulation
   * @param {string} nodeId - ID of node to remove
   * @returns {boolean} True if node was removed
   */
  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) {
      return false; // Node doesn't exist
    }
    
    this.nodes.delete(nodeId);
    this._updateAllNeighbors(); // Update neighbors for remaining nodes
    
    // Remove any packets that had this node as source or destination
    for (const [packetId, packet] of this.packets.entries()) {
      if (packet.getSourceId() === nodeId || packet.getDestinationId() === nodeId) {
        this.packets.delete(packetId);
      }
    }
    
    return true;
  }

  /**
   * Get a node by ID
   * @param {string} nodeId - ID of node to retrieve
   * @returns {Node|null} Node instance or null if not found
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Get all nodes in the simulation
   * @returns {Node[]} Array of all nodes
   */
  getNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Add a packet to the simulation
   * @param {Packet} packet - Packet to add
   * @returns {boolean} True if packet was added
   */
  addPacket(packet) {
    if (!(packet instanceof Packet)) {
      throw new Error('Only Packet instances can be added to simulation');
    }
    
    if (this.packets.has(packet.id)) {
      return false; // Packet already exists
    }
    
    // Validate that source and destination nodes exist
    if (!this.nodes.has(packet.getSourceId()) || !this.nodes.has(packet.getDestinationId())) {
      throw new Error('Source and destination nodes must exist in simulation');
    }
    
    this.packets.set(packet.id, packet);
    return true;
  }

  /**
   * Remove a packet from the simulation
   * @param {string} packetId - ID of packet to remove
   * @returns {boolean} True if packet was removed
   */
  removePacket(packetId) {
    return this.packets.delete(packetId);
  }

  /**
   * Get a packet by ID
   * @param {string} packetId - ID of packet to retrieve
   * @returns {Packet|null} Packet instance or null if not found
   */
  getPacket(packetId) {
    return this.packets.get(packetId) || null;
  }

  /**
   * Get all packets in the simulation
   * @returns {Packet[]} Array of all packets
   */
  getPackets() {
    return Array.from(this.packets.values());
  }

  /**
   * Move a node to a new position
   * @param {string} nodeId - ID of node to move
   * @param {number} x - New x-coordinate
   * @param {number} y - New y-coordinate
   * @returns {boolean} True if node was moved
   */
  moveNode(nodeId, x, y) {
    const node = this.getNode(nodeId);
    if (!node) {
      return false;
    }
    
    // Keep node within simulation bounds
    node.move(
      Math.max(0, Math.min(x, this.width)),
      Math.max(0, Math.min(y, this.height))
    );
    
    // Update neighbors for all nodes since positions changed
    this._updateAllNeighbors();
    return true;
  }

  /**
   * Update neighbors for all nodes based on current positions
   * This should be called whenever nodes move
   */
  _updateAllNeighbors() {
    const nodesArray = this.getNodes();
    for (const node of nodesArray) {
      node.updateNeighbors(nodesArray);
    }
  }

  /**
   * Simulate one time step
   * @param {number} deltaTime - Time elapsed since last step (in milliseconds)
   */
  step(deltaTime = 16) { // Default to ~60fps
    this.time += deltaTime;
    
    // Update packet TTLs and remove expired packets
    for (const [packetId, packet] of this.packets.entries()) {
      if (packet.isExpired()) {
        this.packets.delete(packetId);
      }
    }
  }

  /**
   * Start the simulation
   */
  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    const step = (timestamp) => {
      if (!this.isRunning) {
        return;
      }
      
      this.step(16); // Assume ~60fps
      this.animationFrameId = requestAnimationFrame(step);
    };
    
    this.animationFrameId = requestAnimationFrame(step);
  }

  /**
   * Stop the simulation
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Reset the simulation to initial state
   */
  reset() {
    this.stop();
    this.nodes.clear();
    this.packets.clear();
    this.time = 0;
  }

  /**
   * Get simulation statistics
   * @returns {Object} Statistics about the simulation
   */
  getStatistics() {
    return {
      nodeCount: this.nodes.size,
      packetCount: this.packets.size,
      simulationTime: this.time,
      isRunning: this.isRunning,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Find shortest path between two nodes using BFS
   * @param {string} startNodeId - ID of start node
   * @param {string} endNodeId - ID of end node
   * @returns {string[]} Array of node IDs representing the path, or empty array if no path
   */
  findShortestPath(startNodeId, endNodeId) {
    if (!this.nodes.has(startNodeId) || !this.nodes.has(endNodeId)) {
      return [];
    }
    
    if (startNodeId === endNodeId) {
      return [startNodeId];
    }
    
    const queue = [[startNodeId]];
    const visited = new Set([startNodeId]);
    
    while (queue.length > 0) {
      const path = queue.shift();
      const nodeId = path[path.length - 1];
      const node = this.getNode(nodeId);
      
      if (!node) {
        continue;
      }
      
      for (const neighborId of node.getNeighbors()) {
        if (visited.has(neighborId)) {
          continue;
        }
        
        const newPath = [...path, neighborId];
        
        if (neighborId === endNodeId) {
          return newPath;
        }
        
        visited.add(neighborId);
        queue.push(newPath);
      }
    }
    
    return []; // No path found
  }

  /**
   * Route a packet from source to destination using the shortest path
   * @param {string} packetId - ID of packet to route
   * @returns {boolean} True if packet was routed successfully
   */
  routePacket(packetId) {
    const packet = this.getPacket(packetId);
    if (!packet) {
      return false;
    }
    
    const path = this.findShortestPath(
      packet.getSourceId(),
      packet.getDestinationId()
    );
    
    if (path.length === 0) {
      return false; // No path available
    }
    
    packet.setRoute(path);
    // Add the source as first hop
    packet.addHop(packet.getSourceId());
    
    return true;
  }

  /**
   * Route all packets in the simulation
   */
  routeAllPackets() {
    for (const packet of this.getPackets()) {
      this.routePacket(packet.id);
    }
  }

  /**
   * Check if two nodes can communicate directly (are neighbors)
   * @param {string} nodeId1 - ID of first node
   * @param {string} nodeId2 - ID of second node
   * @returns {boolean} True if nodes are neighbors
   */
  canCommunicateDirectly(nodeId1, nodeId2) {
    const node1 = this.getNode(nodeId1);
    const node2 = this.getNode(nodeId2);
    
    if (!node1 || !node2) {
      return false;
    }
    
    return node1.isNeighbor(nodeId2);
  }
}