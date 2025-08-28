import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { EditorState, SVGPath, ReferenceImage, SVGPoint } from '@/types'

interface EditorStore extends EditorState {
  // Paths
  paths: SVGPath[]
  addPath: (path: SVGPath) => void
  updatePath: (pathId: string, updates: Partial<SVGPath>) => void
  deletePath: (pathId: string) => void

  // Reference images
  referenceImages: ReferenceImage[]
  addReferenceImage: (image: ReferenceImage) => void
  updateReferenceImage: (imageId: string, updates: Partial<ReferenceImage>) => void
  deleteReferenceImage: (imageId: string) => void

  // Editor actions
  setTool: (tool: EditorState['tool']) => void
  setSelectedPath: (pathId?: string) => void
  setSelectedPoints: (points: number[]) => void
  setZoom: (zoom: number) => void
  setPan: (pan: SVGPoint) => void
  toggleGrid: () => void
  toggleSnapToGrid: () => void

  // Viewport actions
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tool: 'select',
    selectedPath: undefined,
    selectedPoints: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    gridVisible: true,
    snapToGrid: false,
    paths: [],
    referenceImages: [],

    // Path actions
    addPath: path =>
      set(state => ({
        paths: [...state.paths, path],
      })),

    updatePath: (pathId, updates) =>
      set(state => ({
        paths: state.paths.map(path => (path.id === pathId ? { ...path, ...updates } : path)),
      })),

    deletePath: pathId =>
      set(state => ({
        paths: state.paths.filter(path => path.id !== pathId),
        selectedPath: state.selectedPath === pathId ? undefined : state.selectedPath,
      })),

    // Reference image actions
    addReferenceImage: image =>
      set(state => ({
        referenceImages: [...state.referenceImages, image],
      })),

    updateReferenceImage: (imageId, updates) =>
      set(state => ({
        referenceImages: state.referenceImages.map(image =>
          image.id === imageId ? { ...image, ...updates } : image
        ),
      })),

    deleteReferenceImage: imageId =>
      set(state => ({
        referenceImages: state.referenceImages.filter(image => image.id !== imageId),
      })),

    // Editor actions
    setTool: tool => set({ tool }),
    setSelectedPath: pathId => set({ selectedPath: pathId }),
    setSelectedPoints: points => set({ selectedPoints: points }),
    setZoom: zoom => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
    setPan: pan => set({ pan }),
    toggleGrid: () => set(state => ({ gridVisible: !state.gridVisible })),
    toggleSnapToGrid: () => set(state => ({ snapToGrid: !state.snapToGrid })),

    // Viewport actions
    zoomIn: () => {
      const currentZoom = get().zoom
      set({ zoom: Math.min(10, currentZoom + 0.1) })
    },

    zoomOut: () => {
      const currentZoom = get().zoom
      set({ zoom: Math.max(0.1, currentZoom - 0.1) })
    },

    resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
  }))
)
