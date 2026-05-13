-- Seed network connections with realistic metrics
-- Uses existing nodes from the nodes table

INSERT INTO connections (source_node, target_node, bandwidth_mbps, latency_ms, status) 
SELECT 
  n1.id as source_node,
  n2.id as target_node,
  FLOOR(RAND() * 900) + 100 as bandwidth_mbps,  -- 100-1000 Mbps
  FLOOR(RAND() * 50) + 1 as latency_ms,           -- 1-51 ms
  CASE 
    WHEN RAND() < 0.9 THEN 'up'                   -- 90% up, 10% down
    ELSE 'down'
  END as status
FROM nodes n1
CROSS JOIN nodes n2
WHERE n1.id < n2.id  -- Avoid duplicates and self-connections
  AND n1.node_type IN ('router', 'switch', 'server')
  AND n2.node_type IN ('router', 'switch', 'server', 'client')
LIMIT 20;

-- Verify
SELECT * FROM connections;
