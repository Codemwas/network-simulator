/**
 * Packet class representing a data packet in the network simulation
 * Contains source, destination, payload, and routing information
 */
export class Packet {
  /**
   * Create a network packet
   * @param {string} id - Unique identifier for the packet
   * @param {string} sourceId - ID of the source node
   * @param {string} destinationId - ID of the destination node
   * @param {any} payload - Data being carried by the packet
   * @param {Object} [options] - Additional options (priority, ttl, etc.)
   */
  constructor(id, sourceId, destinationId, payload, options = {}) {
    this.id = id;
    this.sourceId = sourceId;
    this.destinationId = destinationId;
    this.payload = payload;
    this.timestamp = Date.now();
    this.hops = []; // Track the path taken
    this.ttl = options.ttl || 64; // Time to live (default 64 hops)
    this.priority = options.priority || 0; // Priority level (0 = lowest)
    this.route = []; // Calculated route to destination
  }

  /**
   * Add a hop to the packet's path
   * @param {string} nodeId - ID of the node visited
   */
  addHop(nodeId) {
    if (this.hops.length === 0 || this.hops[this.hops.length - 1] !== nodeId) {
      this.hops.push(nodeId);
    }
    
    // Decrease TTL with each hop
    this.ttl--;
  }

  /**
   * Check if packet has expired (TTL reached 0)
   * @returns {boolean} True if packet has expired
   */
  isExpired() {
    return this.ttl <= 0;
  }

  /**
   * Get the current hop count
   * @returns {number} Number of hops taken
   */
  getHopCount() {
    return this.hops.length;
  }

  /**
   * Get the source node ID
   * @returns {string} Source node ID
   */
  getSourceId() {
    return this.sourceId;
  }

  /**
   * Get the destination node ID
   * @returns {string} Destination node ID
   */
  getDestinationId() {
    return this.destinationId;
  }

  /**
   * Get the packet payload
   * @returns {any} Packet payload
   */
  getPayload() {
    return this.payload;
  }

  /**
   * Set the packet payload
   * @param {any} payload - New payload
   */
  setPayload(payload) {
    this.payload = payload;
  }

  /**
   * Get the route taken by the packet
   * @returns {string[]} Array of node IDs representing the route
   */
  getRoute() {
    return [...this.hops]; // Return a copy
  }

  /**
   * Set the calculated route for the packet
   * @param {string[]} route - Array of node IDs representing the route
   */
  setRoute(route) {
    this.route = [...route];
  }

  /**
   * Get the calculated route
   * @returns {string[]} Calculated route to destination
   */
  getCalculatedRoute() {
    return [...this.route];
  }

  /**
   * Check if packet has reached its destination
   * @param {string} currentNodeId - ID of the current node
   * @returns {boolean} True if at destination
   */
  isAtDestination(currentNodeId) {
    return currentNodeId === this.destinationId;
  }

  /**
   * Get packet age in milliseconds
   * @returns {number} Age of packet in milliseconds
   */
  getAge() {
    return Date.now() - this.timestamp;
  }

  /**
   * Get packet properties
   * @returns {Object} Packet properties
   */
  getProperties() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      destinationId: this.destinationId,
      hopCount: this.getHopCount(),
      ttl: this.ttl,
      priority: this.priority,
      age: this.getAge(),
      isExpired: this.isExpired()
    };
  }
}