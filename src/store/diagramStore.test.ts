import { describe, it, expect, beforeEach } from 'vitest';
import { useDiagramStore } from './diagramStore';
import type { ExternalCategory } from '@/types/diagram';

const { getState } = useDiagramStore;

function resetStore() {
  getState().clearCanvas();
  getState().setDiagramName('Novo Diagrama');
  // Clear undo history
  useDiagramStore.temporal.getState().clear();
}

describe('diagramStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('addNode', () => {
    it('should add a service node', () => {
      getState().addNode('service');
      expect(getState().nodes).toHaveLength(1);
      expect(getState().nodes[0].type).toBe('service');
    });

    it('should add a database node with subType', () => {
      getState().addNode('database', 'Redis');
      const node = getState().nodes[0];
      expect(node.type).toBe('database');
      expect((node.data as any).subType).toBe('Redis');
    });

    it('should add a queue node with Kafka subType', () => {
      getState().addNode('queue', 'Kafka');
      const node = getState().nodes[0];
      expect(node.type).toBe('queue');
      expect((node.data as any).subType).toBe('Kafka');
      expect((node.data as any).label).toBe('Kafka');
    });

    it('should add an external node with gRPC subType', () => {
      getState().addNode('external', 'gRPC');
      const node = getState().nodes[0];
      expect(node.type).toBe('external');
      expect((node.data as any).subType).toBe('gRPC');
      expect((node.data as any).label).toBe('gRPC');
    });
  });

  describe('deleteSelected', () => {
    it('should remove selected nodes and connected edges', () => {
      getState().addNode('service');
      getState().addNode('service');
      const [n1, n2] = getState().nodes;

      getState().setNodes(
        getState().nodes.map((n) => (n.id === n1.id ? { ...n, selected: true } : n))
      );

      getState().setEdges([
        { id: 'e1', source: n1.id, target: n2.id, type: 'editable', data: { waypoints: undefined } },
      ]);

      getState().deleteSelected();
      expect(getState().nodes).toHaveLength(1);
      expect(getState().nodes[0].id).toBe(n2.id);
      expect(getState().edges).toHaveLength(0);
    });
  });

  describe('clearCanvas', () => {
    it('should result in empty arrays', () => {
      getState().addNode('service');
      getState().addNode('database', 'Oracle');
      expect(getState().nodes).toHaveLength(2);

      getState().clearCanvas();
      expect(getState().nodes).toHaveLength(0);
      expect(getState().edges).toHaveLength(0);
    });
  });

  describe('setDiagramName', () => {
    it('should update the diagram name', () => {
      getState().setDiagramName('Meu Diagrama');
      expect(getState().diagramName).toBe('Meu Diagrama');
    });
  });

  describe('exportJSON', () => {
    it('should export valid JSON with name, nodes, edges', () => {
      getState().setDiagramName('Test');
      getState().addNode('service');
      const json = getState().exportJSON();
      const parsed = JSON.parse(json);
      expect(parsed.name).toBe('Test');
      expect(parsed.nodes).toHaveLength(1);
      expect(parsed.edges).toHaveLength(0);
    });
  });

  describe('loadDiagram', () => {
    it('should replace nodes and edges', () => {
      getState().addNode('service');
      const mockNodes = [
        { id: 'a', type: 'service' as const, position: { x: 0, y: 0 }, data: { label: 'A', type: 'service' as const } },
        { id: 'b', type: 'queue' as const, position: { x: 100, y: 0 }, data: { label: 'B', type: 'queue' as const } },
      ];
      getState().loadDiagram(mockNodes as any, []);
      expect(getState().nodes).toHaveLength(2);
      expect(getState().nodes[0].id).toBe('a');
    });
  });

  describe('undo/redo (zundo)', () => {
    it('should undo addNode and restore previous state', () => {
      expect(getState().nodes).toHaveLength(0);

      getState().addNode('service');
      expect(getState().nodes).toHaveLength(1);

      useDiagramStore.temporal.getState().undo();
      expect(getState().nodes).toHaveLength(0);
    });

    it('should redo after undo', () => {
      getState().addNode('service');
      useDiagramStore.temporal.getState().undo();
      expect(getState().nodes).toHaveLength(0);

      useDiagramStore.temporal.getState().redo();
      expect(getState().nodes).toHaveLength(1);
    });
  });

  describe('addNodesFromSource', () => {
    it('cria nós sem conexão automática entre eles', () => {
      getState().addNode('service');
      const sourceId = getState().nodes[0].id;
      getState().addNodesFromSource(sourceId, 'queue', 1, 'Kafka');
      expect(getState().nodes).toHaveLength(2);
      expect(getState().edges).toHaveLength(0);
    });

    it('cria múltiplos nós sem conexões automáticas', () => {
      getState().addNode('queue', 'Kafka');
      const sourceId = getState().nodes[0].id;
      getState().addNodesFromSource(sourceId, 'service', 3);
      expect(getState().nodes).toHaveLength(4);
      expect(getState().edges).toHaveLength(0);
    });

    it('should embed Oracle database inside service node', () => {
      getState().addNode('service');
      const source = getState().nodes[0];

      getState().addNodesFromSource(source.id, 'database', 1, 'Oracle');
      expect(getState().nodes).toHaveLength(1);
      expect((getState().nodes[0].data as any).internalDatabases).toHaveLength(1);
      expect(getState().edges).toHaveLength(0);
    });
  });

  describe('onConnect', () => {
    it('should create an edge between two nodes', () => {
      getState().addNode('service');
      getState().addNode('service');
      const [n1, n2] = getState().nodes;

      getState().onConnect({
        source: n1.id,
        target: n2.id,
        sourceHandle: null,
        targetHandle: null,
      });

      expect(getState().edges).toHaveLength(1);
      expect(getState().edges[0].source).toBe(n1.id);
      expect(getState().edges[0].target).toBe(n2.id);
    });

    it('should label edge "produce" for service→queue', () => {
      getState().addNode('service');
      getState().addNode('queue', 'MQ');
      const [svc, queue] = getState().nodes;

      getState().onConnect({
        source: svc.id,
        target: queue.id,
        sourceHandle: null,
        targetHandle: null,
      });

      expect(getState().edges[0].label).toBe('produce');
    });

    it('should label edge "consume" for queue→service', () => {
      getState().addNode('queue', 'MQ');
      getState().addNode('service');
      const [queue, svc] = getState().nodes;

      getState().onConnect({
        source: queue.id,
        target: svc.id,
        sourceHandle: null,
        targetHandle: null,
      });

      expect(getState().edges[0].label).toBe('consume');
    });
  });

  describe('node rename via setNodes (undo/redo)', () => {
    it('should capture label change in undo history', () => {
      getState().addNode('service');
      const node = getState().nodes[0];
      const originalLabel = (node.data as any).label;
      getState().setNodes(
        getState().nodes.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, label: 'Novo Nome' } } : n
        )
      );
      expect((getState().nodes[0].data as any).label).toBe('Novo Nome');
      useDiagramStore.temporal.getState().undo();
      expect((getState().nodes[0].data as any).label).toBe(originalLabel);
    });
  });

  describe('updateEdgeProtocol', () => {
    it('should update edge protocol and label', () => {
      getState().addNode('service');
      getState().addNode('service');
      const [n1, n2] = getState().nodes;
      getState().setEdges([
        { id: 'e1', source: n1.id, target: n2.id, type: 'editable', data: { waypoints: undefined } },
      ]);
      getState().updateEdgeProtocol('e1', 'gRPC');
      expect((getState().edges[0].data as any).protocol).toBe('gRPC');
      expect(getState().edges[0].label).toBe('gRPC');
    });
  });

  describe('externalCategory undo/redo', () => {
    it('captura mudança de externalCategory no histórico', () => {
      getState().addNode('external', 'REST');
      const nodeId = getState().nodes[0].id;

      getState().setNodes(
        getState().nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, externalCategory: 'Payment' } } : n
        )
      );
      expect((getState().nodes[0].data as any).externalCategory).toBe('Payment');

      useDiagramStore.temporal.getState().undo();
      expect((getState().nodes[0].data as any).externalCategory).toBeUndefined();

      useDiagramStore.temporal.getState().redo();
      expect((getState().nodes[0].data as any).externalCategory).toBe('Payment');
    });

    it('captura múltiplas mudanças de externalCategory consecutivas', () => {
      getState().addNode('external');
      const nodeId = getState().nodes[0].id;

      const setCategory = (cat: ExternalCategory) =>
        useDiagramStore.getState().setNodes(
          useDiagramStore.getState().nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, externalCategory: cat } } : n
          )
        );

      setCategory('API');
      setCategory('Auth');
      setCategory('CDN');

      expect((getState().nodes[0].data as any).externalCategory).toBe('CDN');

      useDiagramStore.temporal.getState().undo();
      expect((getState().nodes[0].data as any).externalCategory).toBe('Auth');
    });
  });
});
