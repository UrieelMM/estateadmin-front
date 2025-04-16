// Modern UI design system for ticket form
export const formStyles = {
  // Modern color palette
  colors: {
    primary: {
      light: "#6366f1", // indigo-500
      main: "#4f46e5", // indigo-600
      dark: "#4338ca", // indigo-700
      hover: "#4f46e5",
      contrast: "#ffffff",
    },
    secondary: {
      light: "#f3f4f6", // gray-100
      main: "#e5e7eb", // gray-200
      dark: "#d1d5db", // gray-300
      hover: "#d1d5db",
      contrast: "#374151",
    },
    accent: {
      light: "#34d399", // emerald-400
      main: "#10b981", // emerald-500
      hover: "#059669", // emerald-600
      contrast: "#ffffff",
    },
    error: {
      light: "#fca5a5", // red-300
      main: "#ef4444", // red-500
      dark: "#b91c1c", // red-700
      contrast: "#ffffff",
    },
    background: {
      light: "#ffffff",
      dark: "#111827", // gray-900
      paper: "#f9fafb", // gray-50
      paperDark: "#1f2937", // gray-800
    },
    text: {
      primary: "#111827", // gray-900
      secondary: "#4b5563", // gray-600
      disabled: "#9ca3af", // gray-400
      primaryDark: "#f9fafb", // gray-50
      secondaryDark: "#d1d5db", // gray-300
    },
    priority: {
      low: {
        bg: "#ecfdf5", // emerald-50
        bgDark: "rgba(6, 78, 59, 0.2)", // emerald-900 with opacity
        text: "#059669", // emerald-600
        textDark: "#34d399", // emerald-400
        border: "#a7f3d0", // emerald-200
        borderDark: "#065f46", // emerald-800
      },
      medium: {
        bg: "#fffbeb", // amber-50
        bgDark: "rgba(120, 53, 15, 0.2)", // amber-900 with opacity
        text: "#d97706", // amber-600
        textDark: "#fbbf24", // amber-400
        border: "#fde68a", // amber-200
        borderDark: "#92400e", // amber-800
      },
      high: {
        bg: "#fff1f2", // rose-50
        bgDark: "rgba(131, 24, 67, 0.2)", // rose-900 with opacity
        text: "#e11d48", // rose-600
        textDark: "#fb7185", // rose-400
        border: "#fecdd3", // rose-200
        borderDark: "#9f1239", // rose-800
      },
    },
    status: {
      open: {
        bg: "#eff6ff", // blue-50
        bgDark: "rgba(30, 58, 138, 0.2)", // blue-900 with opacity
        text: "#2563eb", // blue-600
        textDark: "#60a5fa", // blue-400
        border: "#bfdbfe", // blue-200
        borderDark: "#1e40af", // blue-800
      },
      inProgress: {
        bg: "#f5f3ff", // violet-50
        bgDark: "rgba(76, 29, 149, 0.2)", // violet-900 with opacity
        text: "#7c3aed", // violet-600
        textDark: "#a78bfa", // violet-400
        border: "#ddd6fe", // violet-200
        borderDark: "#5b21b6", // violet-800
      },
      closed: {
        bg: "#f0fdf4", // green-50
        bgDark: "rgba(20, 83, 45, 0.2)", // green-900 with opacity
        text: "#16a34a", // green-600
        textDark: "#4ade80", // green-400
        border: "#bbf7d0", // green-200
        borderDark: "#166534", // green-800
      },
    },
  },

  // Spacing system (in pixels)
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    xxl: "3rem", // 48px
  },

  // Typography
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      md: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      xxl: "1.5rem", // 24px
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Borders and shadows
  borders: {
    radius: {
      sm: "0.25rem", // 4px
      md: "0.375rem", // 6px
      lg: "0.5rem", // 8px
      full: "9999px",
    },
    width: {
      thin: "1px",
      normal: "2px",
      thick: "3px",
    },
  },

  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    focus: "0 0 0 3px rgba(99, 102, 241, 0.4)", // indigo focus ring
  },

  // Transitions
  transitions: {
    short: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    medium: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    long: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// Common component styles
export const componentStyles = {
  formContainer: `bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 transition-all duration-300 
                 border border-gray-100 dark:border-gray-800`,

  formTitle: `text-xl font-semibold mb-6 text-gray-900 dark:text-white 
             flex items-center`,

  // Form fields
  formGroup: `mb-4 relative`,

  formLabel: `block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5`,

  formInput: `w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             transition-colors duration-200 ease-in-out
             focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500
             placeholder:text-gray-400 dark:placeholder:text-gray-500
             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400
             disabled:cursor-not-allowed`,

  formSelect: `w-full px-1 w-[40px] py-2.5 rounded-md border border-gray-300 dark:border-gray-700 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              transition-colors duration-200 ease-in-out
              focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500
              disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400
              disabled:cursor-not-allowed`,

  formTextarea: `w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[100px]
                transition-colors duration-200 ease-in-out
                focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400
                disabled:cursor-not-allowed`,

  // Buttons
  button: {
    base: `px-4 py-2.5 rounded-md font-medium transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1.5`,

    primary: `bg-indigo-600 text-white border border-indigo-600
             hover:bg-indigo-700 hover:border-indigo-700
             active:bg-indigo-800 focus:ring-indigo-500/50`,

    secondary: `bg-white text-gray-700 border border-gray-300
               hover:bg-gray-50 hover:text-gray-900
               active:bg-gray-100 focus:ring-gray-500/30
               dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700
               dark:hover:bg-gray-700 dark:hover:text-white`,

    success: `bg-emerald-600 text-white border border-emerald-600
             hover:bg-emerald-700 hover:border-emerald-700
             active:bg-emerald-800 focus:ring-emerald-500/50`,

    danger: `bg-red-600 text-white border border-red-600
            hover:bg-red-700 hover:border-red-700
            active:bg-red-800 focus:ring-red-500/50`,
  },

  tag: {
    base: `inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium 
          transition-all duration-200 cursor-pointer`,

    inactive: `bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200
              dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700`,

    active: `bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700`,
  },

  fileUpload: {
    button: `inline-flex items-center px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 font-medium text-sm 
            hover:bg-indigo-100 transition-colors cursor-pointer
            dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700`,

    fileChip: `inline-flex items-center px-2.5 py-1.5 rounded-md bg-gray-100 text-xs text-gray-700
              dark:bg-gray-800 dark:text-gray-200 gap-1.5`,

    removeButton: `ml-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors`,
  },

  errorMessage: `text-sm text-red-600 dark:text-red-400 mt-1`,
};
