import { create } from 'zustand'
import { temporal } from 'zundo'

interface Block {
  id: string
  type: string
  [key: string]: unknown
}

interface EditorState {
  blocks: Block[]
  selectedBlockId: string | null
  isDirty: boolean
  setBlocks: (blocks: Block[]) => void
  selectBlock: (id: string | null) => void
  updateBlock: (id: string, updates: Partial<Block>) => void
  reorderBlocks: (fromIndex: number, toIndex: number) => void
}

export const useEditorStore = create<EditorState>()(
  temporal((set) => ({
    blocks: [],
    selectedBlockId: null,
    isDirty: false,
    setBlocks: (blocks) => set({ blocks }),
    selectBlock: (id) => set({ selectedBlockId: id }),
    updateBlock: (id, updates) =>
      set((state) => ({
        blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        isDirty: true,
      })),
    reorderBlocks: (from, to) =>
      set((state) => {
        const blocks = [...state.blocks]
        const [moved] = blocks.splice(from, 1)
        blocks.splice(to, 0, moved)
        return { blocks, isDirty: true }
      }),
  }))
)
