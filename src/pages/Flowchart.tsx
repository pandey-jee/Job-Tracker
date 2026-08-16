import { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import apiClient from '../api/client';

// Define outside component to prevent ReactFlow warning
const nodeTypes = {};
const edgeTypes = {};

const STATUS_COLORS: Record<string, string> = {
  Wishlist: '#64748b',
  Applied: '#3b82f6',
  Interview: '#f59e0b',
  Offer: '#10b981',
  Rejected: '#ef4444',
};

export default function Flowchart() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/jobs').then(res => {
      const jobs = res.data;

      const STAGES = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];
      const grouped: Record<string, any[]> = {};
      STAGES.forEach(s => grouped[s] = []);
      jobs.forEach((j: any) => {
        if (grouped[j.status]) grouped[j.status].push(j);
      });

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Stage header nodes
      STAGES.forEach((stage, colIdx) => {
        newNodes.push({
          id: `stage-${stage}`,
          position: { x: colIdx * 250, y: 0 },
          data: { label: stage },
          style: {
            background: STATUS_COLORS[stage],
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            padding: '8px 16px',
            width: 180,
            textAlign: 'center',
          },
          type: 'default',
        });

        // Job nodes under each stage
        grouped[stage].forEach((job, rowIdx) => {
          const nodeId = `job-${job.id}`;
          newNodes.push({
            id: nodeId,
            position: { x: colIdx * 250, y: 80 + rowIdx * 100 },
            data: { label: `${job.company}\n${job.role}` },
            style: {
              background: '#11141b',
              color: '#f1f5f9',
              border: `1px solid ${STATUS_COLORS[stage]}`,
              borderRadius: '8px',
              padding: '10px',
              width: 180,
              fontSize: '0.8rem',
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
            },
          });

          newEdges.push({
            id: `e-${stage}-${nodeId}`,
            source: `stage-${stage}`,
            target: nodeId,
            style: { stroke: STATUS_COLORS[stage], strokeWidth: 1.5 },
          });
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-secondary)' }}>Building your flowchart...</div>;

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 70px)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="#1e293b" gap={24} />
        <Controls style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }} />
      </ReactFlow>
    </div>
  );
}
