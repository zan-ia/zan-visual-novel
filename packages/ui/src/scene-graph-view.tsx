import { useCallback, useMemo, useState } from 'react';
import type { Scene, Choice } from '@zan-vn/shared';
import type { ElementType } from 'react';
import {
  ReactFlow as ReactFlowOriginal,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

// ReactFlow JSX type compatibility shim for React 19
const ReactFlow = ReactFlowOriginal as unknown as ElementType;

// ── Types ────────────────────────────────────────────────

export interface SceneNodeData extends Record<string, unknown> {
  title: string;
  type: Scene['type'];
  blockCount: number;
  choiceCount: number;
  hasNextScene: boolean;
  isEnding: boolean;
  hasDeadEnd: boolean;
}

export interface SceneGraphViewProps {
  scenes: Scene[];
  choices: Choice[];
  selectedSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  onSceneCreate: () => void;
  onSceneDelete: (sceneId: string) => void;
  onChoiceCreate: (sourceSceneId: string, targetSceneId: string, text?: string) => void;
  onChoiceDelete: (choiceId: string) => void;
  onPositionChange: (sceneId: string, position: { x: number; y: number }) => void;
}

// ── Color palette by scene type ──────────────────────────

const TYPE_COLORS: Record<string, string> = {
  narration: '#4a90d9',
  dialogue: '#9b59b6',
  choice: '#e67e22',
  ending: '#27ae60',
};

const TYPE_LABELS: Record<string, string> = {
  narration: 'Narração',
  dialogue: 'Diálogo',
  choice: 'Escolha',
  ending: 'Final',
};

// ── Custom Scene Node ────────────────────────────────────

function SceneNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as unknown as SceneNodeData;
  const color = TYPE_COLORS[data.type] ?? '#666';
  return (
    <div
      style={{
        background: selected ? 'rgba(255,255,255,0.12)' : 'rgba(30,30,40,0.95)',
        border: `2px solid ${selected ? color : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 180,
        maxWidth: 220,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: selected ? `0 0 0 2px ${color}40` : '0 2px 8px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color, width: 10, height: 10, border: '2px solid #1e1e28' }}
      />

      {/* Scene title */}
      <div style={{ fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 4 }}>
        {data.title}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
        <span
          style={{
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 4,
            background: `${color}22`,
            color,
            fontWeight: 500,
          }}
        >
          {TYPE_LABELS[data.type] ?? data.type}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {data.blockCount} blocos
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {data.choiceCount} escolhas
        </span>
      </div>

      {/* Dead-end warning */}
      {data.hasDeadEnd && !data.isEnding && (
        <div
          style={{
            fontSize: 10,
            color: '#ff6b6b',
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ⚠️ Sem saída — cena não leva a lugar nenhum
        </div>
      )}

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color, width: 10, height: 10, border: '2px solid #1e1e28' }}
      />
    </div>
  );
}

// ── Layout helper (dagre) ────────────────────────────────

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR',
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: dagreNode ? { x: dagreNode.x - 100, y: dagreNode.y - 40 } : node.position,
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── Main Component ───────────────────────────────────────

function SceneGraphViewInner(props: SceneGraphViewProps) {
  const {
    scenes,
    choices: rawChoices,
    selectedSceneId,
    onSceneSelect,
    onSceneCreate,
    onSceneDelete,
    onChoiceCreate,
    onChoiceDelete,
    onPositionChange,
  } = props;

  const [hasLaidOut, setHasLaidOut] = useState(false);

  // Build nodes from scenes
  const initialNodes: Node[] = useMemo(
    () =>
      scenes.map((scene) => {
        const sceneChoices = rawChoices.filter((c) => c.sceneId === scene.id);
        const hasNextScene = !!scene.nextSceneId;
        const isEnding = scene.type === 'ending';
        const hasOutgoing = hasNextScene || sceneChoices.length > 0;
        const pos = (scene.metadata as { position?: { x: number; y: number } } | null)?.position;

        return {
          id: scene.id,
          type: 'sceneNode',
          position: pos ?? { x: 0, y: 0 },
          data: {
            title: scene.title,
            type: scene.type,
            blockCount: scene.content.length,
            choiceCount: sceneChoices.length,
            hasNextScene,
            isEnding,
            hasDeadEnd: !hasOutgoing && !isEnding,
          } satisfies SceneNodeData,
        };
      }),
    [scenes, rawChoices],
  );

  // Build edges from nextSceneId + choices
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    // Default edges (nextSceneId)
    for (const scene of scenes) {
      if (scene.nextSceneId) {
        edges.push({
          id: `next-${scene.id}-${scene.nextSceneId}`,
          source: scene.id,
          target: scene.nextSceneId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.25)' },
          label: '→ continuar',
        });
      }
    }

    // Choice edges
    for (const choice of rawChoices) {
      edges.push({
        id: `choice-${choice.id}`,
        source: choice.sceneId,
        target: choice.targetSceneId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#e67e22', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#e67e22' },
        label: choice.text,
      });
    }

    return edges;
  }, [scenes, rawChoices]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Apply dagre layout on first load or when scenes/choices change
  // but only if positions are not already set
  const hasStoredPositions = useMemo(
    () => scenes.some((s) => (s.metadata as any)?.position),
    [scenes],
  );

  if (!hasLaidOut && !hasStoredPositions && nodes.length > 0) {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setHasLaidOut(true);
  }

  // Sync nodes when scenes change externally
  useMemo(() => {
    if (hasLaidOut) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      // Re-apply layout for new nodes without positions
      const nodesWithoutPos = initialNodes.filter((n) => n.position.x === 0 && n.position.y === 0);
      if (nodesWithoutPos.length > 0) {
        const layouted = getLayoutedElements(initialNodes, initialEdges);
        setNodes(layouted.nodes);
      }
    }
  }, [scenes.length, rawChoices.length]);

  // ── Handlers ───────────────────────────────────────────

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      // Create a choice via callback — parent shows dialog for text
      onChoiceCreate(connection.source, connection.target);
      // Optimistically add the edge
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#e67e22', strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#e67e22' },
            label: 'Nova escolha...',
          },
          eds,
        ),
      );
    },
    [onChoiceCreate, setEdges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSceneSelect(node.id);
    },
    [onSceneSelect],
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSceneSelect(node.id);
    },
    [onSceneSelect],
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      for (const node of deletedNodes) {
        onSceneDelete(node.id);
      }
    },
    [onSceneDelete],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        // choice edges have id prefix "choice-"
        if (edge.id.startsWith('choice-')) {
          const choiceId = edge.id.replace('choice-', '');
          onChoiceDelete(choiceId);
        }
      }
    },
    [onChoiceDelete],
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onPositionChange(node.id, node.position);
    },
    [onPositionChange],
  );

  const handleAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes(layouted.nodes);
    // Save new positions
    layouted.nodes.forEach((n) => {
      onPositionChange(n.id, n.position);
    });
  }, [nodes, edges, setNodes, onPositionChange]);

  // ── Node types ─────────────────────────────────────────

  const nodeTypes = useMemo(
    () => ({
      sceneNode: SceneNode,
    }),
    [],
  );

  return (
    <div style={{ width: '100%', height: 600, position: 'relative' }}>
      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          gap: 6,
        }}
      >
        <button
          onClick={onSceneCreate}
          style={{
            padding: '6px 14px',
            background: '#4a90d9',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          + Nova Cena
        </button>
        <button
          onClick={handleAutoLayout}
          style={{
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 12,
          }}
        >
          ↹ Auto Layout
        </button>
      </div>

      <ReactFlow
        nodes={nodes.map((n) => ({
          ...n,
          selected: n.id === selectedSceneId,
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Control"
        panOnDrag={false}
        panOnScroll
        zoomOnDoubleClick={false}
        style={{ background: '#1a1a23' }}
      >
        <Background color="rgba(255,255,255,0.04)" gap={20} />
        <Controls
          style={{
            background: 'rgba(30,30,40,0.9)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
          }}
        />
        <MiniMap
          style={{
            background: 'rgba(30,30,40,0.9)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          nodeColor={(node) => TYPE_COLORS[(node.data as SceneNodeData)?.type] ?? '#666'}
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
    </div>
  );
}

/**
 * Scene Graph View — Visual narrative editor using React Flow.
 *
 * Renders scenes as nodes and choices/nextScene as edges in an
 * interactive directed graph with drag-and-drop, auto-layout,
 * dead-end detection, and full editing capabilities.
 *
 * Must be wrapped in a ReactFlowProvider if not already within one.
 */
export function SceneGraphView(props: SceneGraphViewProps) {
  return (
    <ReactFlowProvider>
      <SceneGraphViewInner {...props} />
    </ReactFlowProvider>
  );
}
