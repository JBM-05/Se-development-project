import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type LayoutState = {
  sidebarOpen: boolean
  language: 'en' | 'ar'
}

const savedLanguage = localStorage.getItem('event-registration-language')

const initialState: LayoutState = {
  sidebarOpen: false,
  language: savedLanguage === 'ar' ? 'ar' : 'en',
}

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    sidebarToggled(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    sidebarClosed(state) {
      state.sidebarOpen = false
    },
    languageChanged(state, action: PayloadAction<'en' | 'ar'>) {
      state.language = action.payload
      localStorage.setItem('event-registration-language', action.payload)
    },
  },
})

export const { languageChanged, sidebarClosed, sidebarToggled } = layoutSlice.actions
export default layoutSlice.reducer
