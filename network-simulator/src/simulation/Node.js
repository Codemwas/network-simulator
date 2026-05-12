/**
 * Node class representing a network device in the simulation
 * Tracks position, computes neighbors, and handles movement
 */
export class Node {
  /**
   * Create a network node
   * @param {string} id - Unique identifier for the node
   * @param {number} x - Initial x-coordinate
   * @param {number} y - Initial y-coordinate
   * @param {Object} [properties] - Additional properties (type, config, etc.)
   */
  constructor(id, x, y, properties = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.properties = properties;
    this.neighbors = new Set(); // Set of node IDs that are within communication range
    this.communicationRange = properties.communicationRange || 100; // Default communication range
  }

  /**
   * Move the node to a new position
   * @param {number} newX - New x-coordinate
   * @param {number} newY - New y-coordinate
   */
  move(newX, newY) {
    this.x = newX;
    this.y = newY;
    // Note: Neighbor updates are handled by the Simulation class
    // to ensure all nodes have consistent neighbor information
  }

  /**
   * Calculate distance to another node
   * @param {Node} otherNode - The node to calculate distance to
   * @returns {number} Euclidean distance between nodes
   */
  distanceTo(otherNode) {
    const dx = this.x - otherNode.x;
    const dy = this.y - otherNode.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Update neighbors based on a list of all nodes
   * @param {Node[]} allNodes - Array of all nodes in the simulation
   */
  updateNeighbors(allNodes) {
    this.neighbors.clear();
    for (const node of allNodes) {
      if (node.id !== this.id && this.distanceTo(node) <= this.communicationRange) {
        this.neighbors.add(node.id);
      }
    }
  }

  /**
   * Get list of neighbor node IDs
   * @returns {Set} Set of neighbor node IDs
   */
  getNeighbors() {
    return new Set(this.neighbors); // Return a copy to prevent external modification
  }

  /**
   * Check if another node is a neighbor
   * @param {string} nodeId - ID of the node to check
   * @returns {boolean} True if the node is a neighbor
   */
  isNeighbor(nodeId) {
    return this.neighbors.has(nodeId);
  }

  /**
   * Get node position
   * @returns {{x: number, y: number}} Current position
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Set communication range
   * @param {number} range - New communication range
   */
  setCommunicationRange(range) {
    this.communicationRange = range;
  }

  /**
   * Get communication range
   * @returns {number} Current communication range
   */
  getCommunicationRange() {
    return this.communicationRange;
  }

  /**
   * Get node properties
   * @returns {Object} Node properties
   */
  getProperties() {
    return { ...this.properties };
  }

  /**
   * Set node property
   * @param {string} key - Property key
   * @param {any} value - Property value
   */
  setProperty(key, value) {
    this.properties[key] = value;
  }

  /**
   * Get node property
   * @param {string} key - Property key
   * @returns {any} Property value
   */
  getProperty(key) {
    return this.properties[key];
  }
}