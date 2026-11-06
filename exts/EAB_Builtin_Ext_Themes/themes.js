(function () {
  'use strict';
  var THEMES = {
  "builtin-theme-dark": {
    "variables": {
      "--eab-bg": "#1a1a2e",
      "--eab-surface": "#16213e",
      "--eab-sidebar-bg": "#0f1629",
      "--eab-menubar-bg": "#0d1321",
      "--eab-taskbar-bg": "#111827",
      "--eab-statusbar-bg": "#0d1321",
      "--eab-card-bg": "#1e2a4a",
      "--eab-input-bg": "#0f1629",
      "--eab-border": "#2a3a5c",
      "--eab-text": "#e2e8f0",
      "--eab-text-dim": "#8899b4",
      "--eab-accent": "#6366f1",
      "--eab-accent-hover": "#5558e6",
      "--eab-hover": "rgba(99, 102, 241, 0.12)",
      "--eab-danger": "#ef4444",
      "--eab-success": "#22c55e",
      "--eab-warning": "#f59e0b",
      "--eab-info": "#3b82f6"
    },
    "styles": ""
  },
  "builtin-theme-light": {
    "variables": {
      "--eab-bg": "#f8fafc",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#f1f5f9",
      "--eab-menubar-bg": "#e2e8f0",
      "--eab-taskbar-bg": "#e2e8f0",
      "--eab-statusbar-bg": "#e2e8f0",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#f1f5f9",
      "--eab-border": "#cbd5e1",
      "--eab-text": "#0f172a",
      "--eab-text-dim": "#64748b",
      "--eab-accent": "#4f46e5",
      "--eab-hover": "rgba(79, 70, 229, 0.08)"
    },
    "styles": ""
  },
  "builtin-theme-milk": {
    "variables": {
      "--eab-bg": "#faf8f5",
      "--eab-surface": "#fefdfb",
      "--eab-sidebar-bg": "#f5f0eb",
      "--eab-menubar-bg": "#ede4d8",
      "--eab-taskbar-bg": "#ede4d8",
      "--eab-statusbar-bg": "#ede4d8",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#f5f0eb",
      "--eab-border": "#d4c5b2",
      "--eab-text": "#3d3226",
      "--eab-text-dim": "#8b7d6b",
      "--eab-accent": "#b8860b",
      "--eab-accent-hover": "#9a7009",
      "--eab-hover": "rgba(184, 134, 11, 0.08)",
      "--eab-on-accent": "#2b1f00"
    },
    "styles": ""
  },
  "builtin-theme-linear": {
    "variables": {
      "--eab-bg": "#08090a",
      "--eab-surface": "#0f1011",
      "--eab-sidebar-bg": "#0b0c0d",
      "--eab-menubar-bg": "#0b0c0d",
      "--eab-taskbar-bg": "#0b0c0d",
      "--eab-statusbar-bg": "#0b0c0d",
      "--eab-card-bg": "#131415",
      "--eab-input-bg": "#101112",
      "--eab-border": "#23252a",
      "--eab-text": "#f7f8f8",
      "--eab-text-dim": "#8a8f98",
      "--eab-accent": "#5a66ca",
      "--eab-accent-hover": "#5e6ad2",
      "--eab-hover": "rgba(255, 255, 255, 0.05)",
      "--eab-danger": "#eb5757",
      "--eab-success": "#4cb782",
      "--eab-warning": "#f2c94c",
      "--eab-info": "#5e6ad2"
    },
    "styles": ""
  },
  "builtin-theme-geist": {
    "variables": {
      "--eab-bg": "#ffffff",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#fafafa",
      "--eab-menubar-bg": "#fafafa",
      "--eab-taskbar-bg": "#fafafa",
      "--eab-statusbar-bg": "#fafafa",
      "--eab-card-bg": "#fafafa",
      "--eab-input-bg": "#ffffff",
      "--eab-border": "#eaeaea",
      "--eab-text": "#171717",
      "--eab-text-dim": "#666666",
      "--eab-accent": "#171717",
      "--eab-accent-hover": "#333333",
      "--eab-hover": "rgba(0, 0, 0, 0.04)",
      "--eab-danger": "#d92d20",
      "--eab-success": "#157f3d",
      "--eab-warning": "#a35200",
      "--eab-info": "#0b5cad"
    },
    "styles": ""
  },
  "builtin-theme-raycast": {
    "variables": {
      "--eab-bg": "#0e0e10",
      "--eab-surface": "#17171a",
      "--eab-sidebar-bg": "#121215",
      "--eab-menubar-bg": "#121215",
      "--eab-taskbar-bg": "#121215",
      "--eab-statusbar-bg": "#121215",
      "--eab-card-bg": "#1b1b1f",
      "--eab-input-bg": "#1b1b1f",
      "--eab-border": "#2a2a30",
      "--eab-text": "#f2f2f3",
      "--eab-text-dim": "#9a9aa0",
      "--eab-accent": "#cb363c",
      "--eab-accent-hover": "#d13a40",
      "--eab-hover": "rgba(255, 255, 255, 0.08)",
      "--eab-danger": "#ff6363",
      "--eab-success": "#3dd68c",
      "--eab-warning": "#ffb224",
      "--eab-info": "#52a9ff"
    },
    "styles": ""
  },
  "builtin-theme-apple": {
    "variables": {
      "--eab-bg": "#f2f2f7",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#f9f9fb",
      "--eab-menubar-bg": "#f9f9fb",
      "--eab-taskbar-bg": "#f9f9fb",
      "--eab-statusbar-bg": "#f9f9fb",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#f2f2f7",
      "--eab-border": "#d8d8de",
      "--eab-text": "#1c1c1e",
      "--eab-text-dim": "#6e6e73",
      "--eab-accent": "#0069d9",
      "--eab-accent-hover": "#0071e3",
      "--eab-hover": "rgba(0, 113, 227, 0.08)",
      "--eab-danger": "#d70015",
      "--eab-success": "#248a3d",
      "--eab-warning": "#b25000",
      "--eab-info": "#0071e3"
    },
    "styles": ""
  },
  "builtin-theme-bento": {
    "variables": {
      "--eab-bg": "#e7e9ee",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#dee0e7",
      "--eab-menubar-bg": "#dee0e7",
      "--eab-taskbar-bg": "#dee0e7",
      "--eab-statusbar-bg": "#dee0e7",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#f1f2f5",
      "--eab-border": "#ced2db",
      "--eab-text": "#1a1a1d",
      "--eab-text-dim": "#5f6068",
      "--eab-accent": "#0c6159",
      "--eab-accent-hover": "#0f766e",
      "--eab-hover": "rgba(15, 118, 110, 0.09)",
      "--eab-danger": "#c62a2a",
      "--eab-success": "#0f7b4f",
      "--eab-warning": "#a35a00",
      "--eab-info": "#0b6bcb"
    },
    "styles": ""
  },
  "builtin-theme-glass": {
    "variables": {
      "--eab-bg": "#080b14",
      "--eab-surface": "rgba(255, 255, 255, 0.07)",
      "--eab-sidebar-bg": "rgba(255, 255, 255, 0.055)",
      "--eab-menubar-bg": "rgba(255, 255, 255, 0.07)",
      "--eab-taskbar-bg": "rgba(255, 255, 255, 0.07)",
      "--eab-statusbar-bg": "rgba(255, 255, 255, 0.07)",
      "--eab-card-bg": "rgba(255, 255, 255, 0.115)",
      "--eab-input-bg": "rgba(255, 255, 255, 0.075)",
      "--eab-border": "rgba(255, 255, 255, 0.17)",
      "--eab-text": "#edeff5",
      "--eab-text-dim": "#9aa3b8",
      "--eab-accent": "#2559c4",
      "--eab-accent-hover": "#2f6feb",
      "--eab-hover": "rgba(255, 255, 255, 0.12)",
      "--eab-danger": "#f0736f",
      "--eab-success": "#4fc08d",
      "--eab-warning": "#e8b552",
      "--eab-info": "#7aa2f7"
    },
    "styles": ""
  },
  "builtin-theme-brutalist": {
    "variables": {
      "--eab-bg": "#f4f1ea",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#ece7db",
      "--eab-menubar-bg": "#ece7db",
      "--eab-taskbar-bg": "#ece7db",
      "--eab-statusbar-bg": "#ece7db",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#ffffff",
      "--eab-border": "#111111",
      "--eab-text": "#0a0a0a",
      "--eab-text-dim": "#4a4a4a",
      "--eab-accent": "#d93a00",
      "--eab-accent-hover": "#b32f00",
      "--eab-hover": "rgba(17, 17, 17, 0.08)",
      "--eab-danger": "#c1121f",
      "--eab-success": "#15683a",
      "--eab-warning": "#8a4b00",
      "--eab-info": "#1149a8"
    },
    "styles": ""
  },
  "builtin-theme-soft": {
    "variables": {
      "--eab-bg": "#f7f6f4",
      "--eab-surface": "#fffefc",
      "--eab-sidebar-bg": "#f2f0ed",
      "--eab-menubar-bg": "#f2f0ed",
      "--eab-taskbar-bg": "#f2f0ed",
      "--eab-statusbar-bg": "#f2f0ed",
      "--eab-card-bg": "#fffefc",
      "--eab-input-bg": "#f5f3f0",
      "--eab-border": "#e6e2dc",
      "--eab-text": "#3a3733",
      "--eab-text-dim": "#736e66",
      "--eab-accent": "#415f79",
      "--eab-accent-hover": "#4e6f8c",
      "--eab-hover": "rgba(78, 111, 140, 0.07)",
      "--eab-danger": "#b4453c",
      "--eab-success": "#4e7d5b",
      "--eab-warning": "#96702f",
      "--eab-info": "#4e6f8c"
    },
    "styles": ""
  },
  "builtin-theme-cyber": {
    "variables": {
      "--eab-bg": "#070b12",
      "--eab-surface": "#0c121c",
      "--eab-sidebar-bg": "#0a0f18",
      "--eab-menubar-bg": "#0a0f18",
      "--eab-taskbar-bg": "#0a0f18",
      "--eab-statusbar-bg": "#0a0f18",
      "--eab-card-bg": "#0e1520",
      "--eab-input-bg": "#0b1119",
      "--eab-border": "#17243a",
      "--eab-text": "#d7e3f4",
      "--eab-text-dim": "#7c8fa8",
      "--eab-accent": "#a81cb8",
      "--eab-accent-hover": "#c026d3",
      "--eab-hover": "rgba(34, 211, 238, 0.12)",
      "--eab-danger": "#fb7185",
      "--eab-success": "#34d399",
      "--eab-warning": "#fbbf24",
      "--eab-info": "#22d3ee"
    },
    "styles": ""
  },
  "builtin-theme-swiss": {
    "variables": {
      "--eab-bg": "#ffffff",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#f4f4f2",
      "--eab-menubar-bg": "#ffffff",
      "--eab-taskbar-bg": "#f4f4f2",
      "--eab-statusbar-bg": "#f4f4f2",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#ffffff",
      "--eab-border": "#d4d4d4",
      "--eab-text": "#0a0a0a",
      "--eab-text-dim": "#6b6b6b",
      "--eab-accent": "#e30613",
      "--eab-accent-hover": "#c00511",
      "--eab-hover": "rgba(227, 6, 19, 0.06)",
      "--eab-danger": "#c00511",
      "--eab-success": "#10714a",
      "--eab-warning": "#8f5400",
      "--eab-info": "#14459b"
    },
    "styles": ""
  },
  "builtin-theme-skeuomorphism": {
    "variables": {
      "--eab-bg": "#d8d1c3",
      "--eab-surface": "#efe9dc",
      "--eab-sidebar-bg": "#e6dfd0",
      "--eab-menubar-bg": "#cfc6b4",
      "--eab-taskbar-bg": "#cfc6b4",
      "--eab-statusbar-bg": "#cfc6b4",
      "--eab-card-bg": "#f7f2e6",
      "--eab-input-bg": "#fffdf7",
      "--eab-border": "#b3a894",
      "--eab-text": "#2f2a22",
      "--eab-text-dim": "#7a6f5d",
      "--eab-accent": "#8a5a2b",
      "--eab-accent-hover": "#74491f",
      "--eab-on-accent": "#fff8ec",
      "--eab-hover": "rgba(138, 90, 43, 0.12)",
      "--eab-danger": "#a83232",
      "--eab-success": "#3f7a3a",
      "--eab-warning": "#b8791c",
      "--eab-info": "#3a6a8a",
      "--eab-radius": "7px",
      "--eab-radius-sm": "5px",
      "--eab-radius-xl": "10px",
      "--eab-shadow-1": "0 1px 0 #fff inset, 0 1px 2px rgba(60, 48, 30, 0.28)",
      "--eab-shadow-2": "0 1px 0 #fff inset, 0 6px 14px rgba(60, 48, 30, 0.30)",
      "--eab-ring": "0 0 0 3px rgba(138, 90, 43, 0.28)",
      "--eab-control-radius": "5px"
    },
    "styles": `/* Skeuomorphism: real materials — paper stock, brushed metal bars,
   bevelled controls. Depth comes from a light source at the top-left. */
html[data-eab-theme="builtin-theme-skeuomorphism"] body {
  background-image: radial-gradient(circle at 20% 0%, #e7e0d1, #d3cbbb 70%);
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .eab-menubar,
html[data-eab-theme="builtin-theme-skeuomorphism"] .eab-toolbar-row {
  background: linear-gradient(#e3dccd, #c9c0ad 55%, #bdb3a0);
  border-bottom: 1px solid #9c9280;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.75) inset;
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .eab-statusbar {
  background: linear-gradient(#cfc6b4, #b9af9c);
  border-top: 1px solid #9c9280;
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .card,
html[data-eab-theme="builtin-theme-skeuomorphism"] .eab-left-panel {
  background: linear-gradient(#fbf7ee, #f1ebdd);
  border: 1px solid #b3a894;
  box-shadow: 0 1px 0 #fff inset, 0 2px 4px rgba(60, 48, 30, 0.18);
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .card-title {
  color: #4a3d2a;
  text-shadow: 0 1px 0 #fff;
}
html[data-eab-theme="builtin-theme-skeuomorphism"] input,
html[data-eab-theme="builtin-theme-skeuomorphism"] select,
html[data-eab-theme="builtin-theme-skeuomorphism"] textarea {
  background: #fffdf7;
  border: 1px solid #a89c88;
  box-shadow: 0 1px 2px rgba(60, 48, 30, 0.22) inset, 0 1px 0 #fff;
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .btn,
html[data-eab-theme="builtin-theme-skeuomorphism"] .eab-button {
  background: linear-gradient(#fdfaf3, #e2dac9 52%, #d3c9b5);
  border: 1px solid #a89c88;
  box-shadow: 0 1px 0 #fff inset, 0 -1px 0 rgba(120, 105, 80, 0.25) inset, 0 1px 2px rgba(60, 48, 30, 0.25);
  text-shadow: 0 1px 0 #fff;
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .btn:hover,
html[data-eab-theme="builtin-theme-skeuomorphism"] .eab-button:hover:not(:disabled) {
  background: linear-gradient(#fffdf8, #eae2d2 52%, #dbd1bd);
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .btn-primary,
html[data-eab-theme="builtin-theme-skeuomorphism"] .eab-button-primary {
  background: linear-gradient(#a9713c, #8a5a2b 52%, #74491f);
  border-color: #5f3a17;
  color: #fff8ec;
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.35);
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .taskbar-tab.active {
  background: linear-gradient(#a9713c, #74491f);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset;
}
html[data-eab-theme="builtin-theme-skeuomorphism"] .menu-dropdown {
  background: linear-gradient(#fbf7ee, #f1ebdd);
  border: 1px solid #a89c88;
  box-shadow: 0 10px 22px rgba(60, 48, 30, 0.35);
}`
  },
  "builtin-theme-minimalism": {
    "variables": {
      "--eab-bg": "#ffffff",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#fcfcfc",
      "--eab-menubar-bg": "#ffffff",
      "--eab-taskbar-bg": "#ffffff",
      "--eab-statusbar-bg": "#ffffff",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#ffffff",
      "--eab-border": "#e8e8e8",
      "--eab-text": "#111111",
      "--eab-text-dim": "#8a8a8a",
      "--eab-accent": "#111111",
      "--eab-accent-hover": "#333333",
      "--eab-on-accent": "#ffffff",
      "--eab-hover": "rgba(0, 0, 0, 0.035)",
      "--eab-danger": "#c0392b",
      "--eab-success": "#2e7d4f",
      "--eab-warning": "#a86a12",
      "--eab-info": "#2b6cb0",
      "--eab-radius": "2px",
      "--eab-radius-sm": "2px",
      "--eab-radius-xl": "3px",
      "--eab-shadow-1": "none",
      "--eab-shadow-2": "0 1px 2px rgba(0, 0, 0, 0.06)",
      "--eab-ring": "0 0 0 2px rgba(17, 17, 17, 0.18)",
      "--eab-control-radius": "2px",
      "--eab-control-h": "30px",
      "--eab-gutter": "28px"
    },
    "styles": `/* Minimalism: nothing decorative. Hairlines, air, one ink colour. */
html[data-eab-theme="builtin-theme-minimalism"] body {
  letter-spacing: 0.005em;
}
html[data-eab-theme="builtin-theme-minimalism"] .eab-menubar,
html[data-eab-theme="builtin-theme-minimalism"] .eab-toolbar-row,
html[data-eab-theme="builtin-theme-minimalism"] .eab-statusbar {
  border-color: #ededed;
  box-shadow: none;
}
html[data-eab-theme="builtin-theme-minimalism"] .card {
  border: 1px solid #ededed;
  box-shadow: none;
  padding: 18px 20px;
}
html[data-eab-theme="builtin-theme-minimalism"] .card-title {
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #111111;
}
html[data-eab-theme="builtin-theme-minimalism"] .btn,
html[data-eab-theme="builtin-theme-minimalism"] .eab-button {
  border: 1px solid #dcdcdc;
  background: #ffffff;
  font-weight: 450;
  box-shadow: none;
}
html[data-eab-theme="builtin-theme-minimalism"] .btn:hover,
html[data-eab-theme="builtin-theme-minimalism"] .eab-button:hover:not(:disabled) {
  border-color: #111111;
  background: #ffffff;
}
html[data-eab-theme="builtin-theme-minimalism"] .btn-primary,
html[data-eab-theme="builtin-theme-minimalism"] .eab-button-primary {
  background: #111111;
  border-color: #111111;
  color: #ffffff;
}
html[data-eab-theme="builtin-theme-minimalism"] input,
html[data-eab-theme="builtin-theme-minimalism"] select,
html[data-eab-theme="builtin-theme-minimalism"] textarea {
  border: 1px solid #e2e2e2;
  background: #ffffff;
  box-shadow: none;
}
html[data-eab-theme="builtin-theme-minimalism"] .taskbar-tab.active {
  background: #111111;
  border-color: #111111;
}
html[data-eab-theme="builtin-theme-minimalism"] .menu-dropdown {
  border: 1px solid #e8e8e8;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
}`
  },
  "builtin-theme-glassmorphism": {
    "variables": {
      "--eab-bg": "#1b1035",
      "--eab-surface": "rgba(255, 255, 255, 0.09)",
      "--eab-sidebar-bg": "rgba(255, 255, 255, 0.06)",
      "--eab-menubar-bg": "rgba(255, 255, 255, 0.07)",
      "--eab-taskbar-bg": "rgba(255, 255, 255, 0.05)",
      "--eab-statusbar-bg": "rgba(255, 255, 255, 0.05)",
      "--eab-card-bg": "rgba(255, 255, 255, 0.10)",
      "--eab-input-bg": "rgba(255, 255, 255, 0.12)",
      "--eab-border": "rgba(255, 255, 255, 0.22)",
      "--eab-text": "#f6f2ff",
      "--eab-text-dim": "#c3b8e0",
      "--eab-accent": "#a78bfa",
      "--eab-accent-hover": "#8b6cf0",
      "--eab-on-accent": "#1b1035",
      "--eab-hover": "rgba(255, 255, 255, 0.12)",
      "--eab-danger": "#ff7a90",
      "--eab-success": "#5ee6a8",
      "--eab-warning": "#ffc46b",
      "--eab-info": "#7cc7ff",
      "--eab-radius": "14px",
      "--eab-radius-sm": "10px",
      "--eab-radius-xl": "20px",
      "--eab-shadow-1": "0 1px 0 rgba(255, 255, 255, 0.25) inset, 0 8px 24px rgba(10, 4, 30, 0.35)",
      "--eab-shadow-2": "0 1px 0 rgba(255, 255, 255, 0.3) inset, 0 18px 44px rgba(10, 4, 30, 0.45)",
      "--eab-ring": "0 0 0 3px rgba(167, 139, 250, 0.35)",
      "--eab-control-radius": "10px"
    },
    "styles": `/* Glassmorphism: frosted panes floating over a saturated gradient. */
html[data-eab-theme="builtin-theme-glassmorphism"] body {
  background:
    radial-gradient(60% 60% at 12% 8%, #6d28d9 0%, transparent 60%),
    radial-gradient(55% 55% at 88% 12%, #0ea5e9 0%, transparent 62%),
    radial-gradient(70% 70% at 50% 100%, #db2777 0%, transparent 60%),
    #1b1035;
  background-attachment: fixed;
}
html[data-eab-theme="builtin-theme-glassmorphism"] .eab-menubar,
html[data-eab-theme="builtin-theme-glassmorphism"] .eab-toolbar-row,
html[data-eab-theme="builtin-theme-glassmorphism"] .eab-statusbar,
html[data-eab-theme="builtin-theme-glassmorphism"] .eab-left-panel,
html[data-eab-theme="builtin-theme-glassmorphism"] .eab-center-panel,
html[data-eab-theme="builtin-theme-glassmorphism"] .card,
html[data-eab-theme="builtin-theme-glassmorphism"] .menu-dropdown {
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.28) inset, 0 10px 30px rgba(10, 4, 30, 0.35);
}
html[data-eab-theme="builtin-theme-glassmorphism"] .card {
  border-radius: 14px;
}
html[data-eab-theme="builtin-theme-glassmorphism"] .card-title {
  color: #ffffff;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
}
html[data-eab-theme="builtin-theme-glassmorphism"] input,
html[data-eab-theme="builtin-theme-glassmorphism"] select,
html[data-eab-theme="builtin-theme-glassmorphism"] textarea {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
html[data-eab-theme="builtin-theme-glassmorphism"] .btn,
html[data-eab-theme="builtin-theme-glassmorphism"] .eab-button {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
html[data-eab-theme="builtin-theme-glassmorphism"] .btn-primary,
html[data-eab-theme="builtin-theme-glassmorphism"] .eab-button-primary {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.95), rgba(124, 199, 255, 0.9));
  border-color: rgba(255, 255, 255, 0.5);
  color: #1b1035;
  font-weight: 650;
}
html[data-eab-theme="builtin-theme-glassmorphism"] .taskbar-tab.active {
  background: rgba(255, 255, 255, 0.24);
  border-color: rgba(255, 255, 255, 0.45);
  color: #ffffff;
}`
  },
  "builtin-theme-neumorphism": {
    "variables": {
      "--eab-bg": "#e0e5ec",
      "--eab-surface": "#e0e5ec",
      "--eab-sidebar-bg": "#e0e5ec",
      "--eab-menubar-bg": "#e0e5ec",
      "--eab-taskbar-bg": "#e0e5ec",
      "--eab-statusbar-bg": "#e0e5ec",
      "--eab-card-bg": "#e0e5ec",
      "--eab-input-bg": "#e0e5ec",
      "--eab-border": "#cfd6e0",
      "--eab-text": "#3d4a5c",
      "--eab-text-dim": "#7b8798",
      "--eab-accent": "#5b7cfa",
      "--eab-accent-hover": "#4463e0",
      "--eab-on-accent": "#ffffff",
      "--eab-hover": "rgba(91, 124, 250, 0.10)",
      "--eab-danger": "#d9534f",
      "--eab-success": "#4a9d6a",
      "--eab-warning": "#c98a2b",
      "--eab-info": "#4a86c8",
      "--eab-radius": "16px",
      "--eab-radius-sm": "12px",
      "--eab-radius-xl": "22px",
      "--eab-shadow-1": "5px 5px 12px #b8c0cc, -5px -5px 12px #ffffff",
      "--eab-shadow-2": "9px 9px 20px #b8c0cc, -9px -9px 20px #ffffff",
      "--eab-ring": "0 0 0 3px rgba(91, 124, 250, 0.25)",
      "--eab-control-radius": "12px"
    },
    "styles": `/* Neumorphism: one material, extruded. Light from the top-left,
   so every raised surface is a light shadow plus a dark one. */
html[data-eab-theme="builtin-theme-neumorphism"] body {
  background: #e0e5ec;
}
html[data-eab-theme="builtin-theme-neumorphism"] .eab-menubar,
html[data-eab-theme="builtin-theme-neumorphism"] .eab-toolbar-row,
html[data-eab-theme="builtin-theme-neumorphism"] .eab-statusbar {
  background: #e0e5ec;
  border-color: transparent;
  box-shadow: 0 4px 10px #c3cad6, 0 -2px 6px #ffffff;
}
html[data-eab-theme="builtin-theme-neumorphism"] .card,
html[data-eab-theme="builtin-theme-neumorphism"] .eab-left-panel {
  background: #e0e5ec;
  border: none;
  box-shadow: 6px 6px 14px #bcc4d1, -6px -6px 14px #ffffff;
}
html[data-eab-theme="builtin-theme-neumorphism"] .card-title {
  color: #3d4a5c;
  font-weight: 600;
}
html[data-eab-theme="builtin-theme-neumorphism"] input,
html[data-eab-theme="builtin-theme-neumorphism"] select,
html[data-eab-theme="builtin-theme-neumorphism"] textarea {
  background: #e0e5ec;
  border: none;
  box-shadow: inset 4px 4px 8px #bcc4d1, inset -4px -4px 8px #ffffff;
}
html[data-eab-theme="builtin-theme-neumorphism"] input:focus,
html[data-eab-theme="builtin-theme-neumorphism"] select:focus,
html[data-eab-theme="builtin-theme-neumorphism"] textarea:focus {
  box-shadow: inset 4px 4px 8px #bcc4d1, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(91, 124, 250, 0.35);
}
html[data-eab-theme="builtin-theme-neumorphism"] .btn,
html[data-eab-theme="builtin-theme-neumorphism"] .eab-button {
  background: #e0e5ec;
  border: none;
  box-shadow: 4px 4px 9px #bcc4d1, -4px -4px 9px #ffffff;
  color: #3d4a5c;
}
html[data-eab-theme="builtin-theme-neumorphism"] .btn:hover,
html[data-eab-theme="builtin-theme-neumorphism"] .eab-button:hover:not(:disabled) {
  box-shadow: 2px 2px 5px #bcc4d1, -2px -2px 5px #ffffff;
}
html[data-eab-theme="builtin-theme-neumorphism"] .btn:active,
html[data-eab-theme="builtin-theme-neumorphism"] .eab-button:active {
  box-shadow: inset 3px 3px 7px #bcc4d1, inset -3px -3px 7px #ffffff;
}
html[data-eab-theme="builtin-theme-neumorphism"] .btn-primary,
html[data-eab-theme="builtin-theme-neumorphism"] .eab-button-primary {
  background: #5b7cfa;
  color: #ffffff;
  box-shadow: 4px 4px 10px #b3bccb, -4px -4px 10px #ffffff;
}
html[data-eab-theme="builtin-theme-neumorphism"] .taskbar-tab.active {
  background: #e0e5ec;
  color: #5b7cfa;
  border-color: transparent;
  box-shadow: inset 3px 3px 7px #bcc4d1, inset -3px -3px 7px #ffffff;
}
html[data-eab-theme="builtin-theme-neumorphism"] .menu-dropdown {
  background: #e0e5ec;
  border: none;
  box-shadow: 8px 8px 20px #b3bccb, -8px -8px 20px #ffffff;
}`
  },
  "builtin-theme-claymorphism": {
    "variables": {
      "--eab-bg": "#eef0ff",
      "--eab-surface": "#f7f5ff",
      "--eab-sidebar-bg": "#f2efff",
      "--eab-menubar-bg": "#f7f5ff",
      "--eab-taskbar-bg": "#f7f5ff",
      "--eab-statusbar-bg": "#f7f5ff",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#f4f1ff",
      "--eab-border": "#ded8f7",
      "--eab-text": "#3b3357",
      "--eab-text-dim": "#8b83a8",
      "--eab-accent": "#7c5cff",
      "--eab-accent-hover": "#6a48f0",
      "--eab-on-accent": "#ffffff",
      "--eab-hover": "rgba(124, 92, 255, 0.10)",
      "--eab-danger": "#f2647a",
      "--eab-success": "#3fc48a",
      "--eab-warning": "#f0a93c",
      "--eab-info": "#4fa8f5",
      "--eab-radius": "22px",
      "--eab-radius-sm": "16px",
      "--eab-radius-xl": "30px",
      "--eab-shadow-1": "inset -3px -3px 8px rgba(124, 92, 255, 0.10), inset 3px 3px 8px #ffffff, 6px 6px 16px rgba(124, 92, 255, 0.16)",
      "--eab-shadow-2": "inset -4px -4px 10px rgba(124, 92, 255, 0.12), inset 4px 4px 10px #ffffff, 12px 12px 28px rgba(124, 92, 255, 0.22)",
      "--eab-ring": "0 0 0 3px rgba(124, 92, 255, 0.28)",
      "--eab-control-radius": "16px",
      "--eab-control-h": "36px"
    },
    "styles": `/* Claymorphism: puffy, matte, pastel. Big radii, soft inner light,
   and a coloured ambient shadow so shapes read as moulded clay. */
html[data-eab-theme="builtin-theme-claymorphism"] body {
  background: radial-gradient(120% 100% at 50% 0%, #f6f3ff, #e7e9ff 70%);
}
html[data-eab-theme="builtin-theme-claymorphism"] .eab-menubar,
html[data-eab-theme="builtin-theme-claymorphism"] .eab-toolbar-row,
html[data-eab-theme="builtin-theme-claymorphism"] .eab-statusbar {
  background: #f7f5ff;
  border-color: #e6e1fb;
  box-shadow: 0 4px 12px rgba(124, 92, 255, 0.10);
}
html[data-eab-theme="builtin-theme-claymorphism"] .card,
html[data-eab-theme="builtin-theme-claymorphism"] .eab-left-panel {
  background: #ffffff;
  border: 1px solid #ece7ff;
  border-radius: 22px;
  box-shadow: inset -4px -4px 10px rgba(124, 92, 255, 0.10), inset 4px 4px 10px #ffffff, 10px 10px 24px rgba(124, 92, 255, 0.16);
}
html[data-eab-theme="builtin-theme-claymorphism"] .card-title {
  color: #4a3f74;
  font-weight: 700;
}
html[data-eab-theme="builtin-theme-claymorphism"] input,
html[data-eab-theme="builtin-theme-claymorphism"] select,
html[data-eab-theme="builtin-theme-claymorphism"] textarea {
  background: #f4f1ff;
  border: 1px solid #e4ddfb;
  border-radius: 16px;
  box-shadow: inset 2px 2px 6px rgba(124, 92, 255, 0.12), inset -2px -2px 6px #ffffff;
}
html[data-eab-theme="builtin-theme-claymorphism"] .btn,
html[data-eab-theme="builtin-theme-claymorphism"] .eab-button {
  background: #ffffff;
  border: 1px solid #e8e2ff;
  border-radius: 16px;
  box-shadow: inset -2px -2px 6px rgba(124, 92, 255, 0.10), inset 2px 2px 6px #ffffff, 4px 4px 12px rgba(124, 92, 255, 0.16);
  color: #4a3f74;
  font-weight: 600;
}
html[data-eab-theme="builtin-theme-claymorphism"] .btn:hover,
html[data-eab-theme="builtin-theme-claymorphism"] .eab-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: inset -2px -2px 6px rgba(124, 92, 255, 0.10), inset 2px 2px 6px #ffffff, 6px 8px 18px rgba(124, 92, 255, 0.22);
}
html[data-eab-theme="builtin-theme-claymorphism"] .btn-primary,
html[data-eab-theme="builtin-theme-claymorphism"] .eab-button-primary {
  background: linear-gradient(160deg, #9b83ff, #7c5cff);
  border-color: #6a48f0;
  color: #ffffff;
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.35), 6px 8px 20px rgba(124, 92, 255, 0.35);
}
html[data-eab-theme="builtin-theme-claymorphism"] .taskbar-tab {
  border-radius: 12px;
}
html[data-eab-theme="builtin-theme-claymorphism"] .taskbar-tab.active {
  background: linear-gradient(160deg, #9b83ff, #7c5cff);
  border-color: #6a48f0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
html[data-eab-theme="builtin-theme-claymorphism"] .menu-dropdown {
  background: #ffffff;
  border: 1px solid #ece7ff;
  border-radius: 18px;
  box-shadow: 10px 12px 30px rgba(124, 92, 255, 0.22);
}`
  },
  "builtin-theme-neo-brutalism": {
    "variables": {
      "--eab-bg": "#f4f0e6",
      "--eab-surface": "#fffdf6",
      "--eab-sidebar-bg": "#fffdf6",
      "--eab-menubar-bg": "#ffe14d",
      "--eab-taskbar-bg": "#ffe14d",
      "--eab-statusbar-bg": "#ffe14d",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#ffffff",
      "--eab-border": "#000000",
      "--eab-text": "#000000",
      "--eab-text-dim": "#4a4a4a",
      "--eab-accent": "#ff4d00",
      "--eab-accent-hover": "#e03f00",
      "--eab-on-accent": "#ffffff",
      "--eab-hover": "rgba(255, 77, 0, 0.16)",
      "--eab-danger": "#e00000",
      "--eab-success": "#00a35c",
      "--eab-warning": "#c47f00",
      "--eab-info": "#0057ff",
      "--eab-radius": "0px",
      "--eab-radius-sm": "0px",
      "--eab-radius-xl": "0px",
      "--eab-shadow-1": "3px 3px 0 #000000",
      "--eab-shadow-2": "6px 6px 0 #000000",
      "--eab-ring": "0 0 0 3px #000000",
      "--eab-control-radius": "0px",
      "--eab-font": "'Arial Black', 'Segoe UI', Impact, sans-serif"
    },
    "styles": `/* Neo brutalism: paper stock, hard black rules, offset shadows,
   one screaming accent. Nothing is soft. */
html[data-eab-theme="builtin-theme-neo-brutalism"] body {
  background: #f4f0e6;
  font-weight: 500;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-menubar,
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-toolbar-row,
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-statusbar {
  background: #ffe14d;
  border-bottom: 3px solid #000000;
  box-shadow: none;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-statusbar {
  border-top: 3px solid #000000;
  border-bottom: none;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .card,
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-left-panel {
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  box-shadow: 6px 6px 0 #000000;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .card-title {
  color: #000000;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] input,
html[data-eab-theme="builtin-theme-neo-brutalism"] select,
html[data-eab-theme="builtin-theme-neo-brutalism"] textarea {
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  box-shadow: 3px 3px 0 #000000;
  font-weight: 600;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .btn,
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-button {
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  box-shadow: 4px 4px 0 #000000;
  color: #000000;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .btn:hover,
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-button:hover:not(:disabled) {
  background: #ffe14d;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #000000;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .btn:active,
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-button:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 #000000;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .btn-primary,
html[data-eab-theme="builtin-theme-neo-brutalism"] .eab-button-primary {
  background: #ff4d00;
  border-color: #000000;
  color: #ffffff;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .taskbar-tab {
  border: 2px solid transparent;
  border-radius: 0;
  font-weight: 700;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .taskbar-tab.active {
  background: #ff4d00;
  border-color: #000000;
  color: #ffffff;
  box-shadow: 2px 2px 0 #000000;
}
html[data-eab-theme="builtin-theme-neo-brutalism"] .menu-dropdown {
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  box-shadow: 6px 6px 0 #000000;
}`
  },
  "builtin-theme-bento-grid": {
    "variables": {
      "--eab-bg": "#f1f2f4",
      "--eab-surface": "#f1f2f4",
      "--eab-sidebar-bg": "#f1f2f4",
      "--eab-menubar-bg": "#ffffff",
      "--eab-taskbar-bg": "#ffffff",
      "--eab-statusbar-bg": "#ffffff",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#f6f7f9",
      "--eab-border": "#e3e5e9",
      "--eab-text": "#14161a",
      "--eab-text-dim": "#6b7280",
      "--eab-accent": "#0a84ff",
      "--eab-accent-hover": "#0069d9",
      "--eab-on-accent": "#ffffff",
      "--eab-hover": "rgba(10, 132, 255, 0.08)",
      "--eab-danger": "#e5484d",
      "--eab-success": "#2f9e44",
      "--eab-warning": "#e8a33d",
      "--eab-info": "#0a84ff",
      "--eab-radius": "16px",
      "--eab-radius-sm": "12px",
      "--eab-radius-xl": "22px",
      "--eab-shadow-1": "0 1px 2px rgba(16, 24, 40, 0.05)",
      "--eab-shadow-2": "0 8px 24px rgba(16, 24, 40, 0.10)",
      "--eab-ring": "0 0 0 3px rgba(10, 132, 255, 0.22)",
      "--eab-control-radius": "10px",
      "--eab-gutter": "14px"
    },
    "styles": `/* Bento grid: the page is a tray of tiles. Each card is its own
   rounded module with a hairline and a whisper of elevation. */
html[data-eab-theme="builtin-theme-bento-grid"] body {
  background: #f1f2f4;
}
html[data-eab-theme="builtin-theme-bento-grid"] .eab-menubar,
html[data-eab-theme="builtin-theme-bento-grid"] .eab-toolbar-row,
html[data-eab-theme="builtin-theme-bento-grid"] .eab-statusbar {
  background: #ffffff;
  border-color: #e3e5e9;
}
html[data-eab-theme="builtin-theme-bento-grid"] .card {
  background: #ffffff;
  border: 1px solid #e3e5e9;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
  padding: 16px 18px;
}
html[data-eab-theme="builtin-theme-bento-grid"] .card:hover {
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.10);
}
html[data-eab-theme="builtin-theme-bento-grid"] .card-title {
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: #14161a;
}
html[data-eab-theme="builtin-theme-bento-grid"] .eab-left-panel {
  background: #f1f2f4;
  border-right: 1px solid #e3e5e9;
}
html[data-eab-theme="builtin-theme-bento-grid"] .lp-ext-item {
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e9ebef;
  margin: 3px 0;
}
html[data-eab-theme="builtin-theme-bento-grid"] .lp-ext-item.active {
  border-color: #0a84ff;
  box-shadow: 0 0 0 1px #0a84ff inset;
}
html[data-eab-theme="builtin-theme-bento-grid"] input,
html[data-eab-theme="builtin-theme-bento-grid"] select,
html[data-eab-theme="builtin-theme-bento-grid"] textarea {
  background: #f6f7f9;
  border: 1px solid #e3e5e9;
  border-radius: 10px;
}
html[data-eab-theme="builtin-theme-bento-grid"] .btn,
html[data-eab-theme="builtin-theme-bento-grid"] .eab-button {
  background: #ffffff;
  border: 1px solid #e3e5e9;
  border-radius: 10px;
  font-weight: 550;
}
html[data-eab-theme="builtin-theme-bento-grid"] .btn-primary,
html[data-eab-theme="builtin-theme-bento-grid"] .eab-button-primary {
  background: #0a84ff;
  border-color: #0a84ff;
  color: #ffffff;
}
html[data-eab-theme="builtin-theme-bento-grid"] .taskbar-tab {
  border-radius: 8px;
}
html[data-eab-theme="builtin-theme-bento-grid"] .taskbar-tab.active {
  background: #0a84ff;
  border-color: #0a84ff;
}
html[data-eab-theme="builtin-theme-bento-grid"] .menu-dropdown {
  background: #ffffff;
  border: 1px solid #e3e5e9;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.14);
}`
  },
  "builtin-theme-retro-y2k": {
    "variables": {
      "--eab-bg": "#0a0a1f",
      "--eab-surface": "#141433",
      "--eab-sidebar-bg": "#10102a",
      "--eab-menubar-bg": "#1b1b45",
      "--eab-taskbar-bg": "#1b1b45",
      "--eab-statusbar-bg": "#1b1b45",
      "--eab-card-bg": "#191940",
      "--eab-input-bg": "#0d0d26",
      "--eab-border": "#3d3d7a",
      "--eab-text": "#e6f1ff",
      "--eab-text-dim": "#8f9bd6",
      "--eab-accent": "#00e5ff",
      "--eab-accent-hover": "#00c2d9",
      "--eab-on-accent": "#04121a",
      "--eab-hover": "rgba(0, 229, 255, 0.14)",
      "--eab-danger": "#ff2e88",
      "--eab-success": "#39ff88",
      "--eab-warning": "#ffd400",
      "--eab-info": "#7a5cff",
      "--eab-radius": "4px",
      "--eab-radius-sm": "3px",
      "--eab-radius-xl": "6px",
      "--eab-shadow-1": "0 0 0 1px rgba(0, 229, 255, 0.25), 0 0 12px rgba(0, 229, 255, 0.18)",
      "--eab-shadow-2": "0 0 0 1px rgba(255, 46, 136, 0.35), 0 0 22px rgba(122, 92, 255, 0.35)",
      "--eab-ring": "0 0 0 2px #00e5ff, 0 0 12px rgba(0, 229, 255, 0.55)",
      "--eab-control-radius": "3px",
      "--eab-font": "'Trebuchet MS', 'Segoe UI', Tahoma, sans-serif"
    },
    "styles": `/* Retro Y2K: chrome gradients, techno type, cyan/magenta glow,
   and a starfield behind the glass. */
html[data-eab-theme="builtin-theme-retro-y2k"] body {
  background:
    radial-gradient(1px 1px at 20% 30%, #ffffff 50%, transparent 51%),
    radial-gradient(1px 1px at 70% 15%, #9fe8ff 50%, transparent 51%),
    radial-gradient(1px 1px at 45% 70%, #ffffff 50%, transparent 51%),
    radial-gradient(1px 1px at 85% 60%, #ff9fe0 50%, transparent 51%),
    linear-gradient(180deg, #0a0a1f, #141433 60%, #0a0a1f);
  background-size: 220px 220px, 180px 180px, 260px 260px, 200px 200px, 100% 100%;
}
html[data-eab-theme="builtin-theme-retro-y2k"] .eab-menubar,
html[data-eab-theme="builtin-theme-retro-y2k"] .eab-toolbar-row {
  background: linear-gradient(180deg, #3a3a8a, #1b1b45 55%, #10102a);
  border-bottom: 1px solid #00e5ff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.25) inset, 0 0 14px rgba(0, 229, 255, 0.25);
}
html[data-eab-theme="builtin-theme-retro-y2k"] .eab-statusbar {
  background: linear-gradient(180deg, #1b1b45, #10102a);
  border-top: 1px solid #ff2e88;
}
html[data-eab-theme="builtin-theme-retro-y2k"] .card {
  background: linear-gradient(180deg, #1d1d4d, #141433);
  border: 1px solid #3d3d7a;
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.18), 0 0 18px rgba(0, 229, 255, 0.12);
}
html[data-eab-theme="builtin-theme-retro-y2k"] .card-title {
  color: #00e5ff;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.65);
}
html[data-eab-theme="builtin-theme-retro-y2k"] input,
html[data-eab-theme="builtin-theme-retro-y2k"] select,
html[data-eab-theme="builtin-theme-retro-y2k"] textarea {
  background: #0d0d26;
  border: 1px solid #3d3d7a;
  color: #e6f1ff;
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.12) inset;
}
html[data-eab-theme="builtin-theme-retro-y2k"] .btn,
html[data-eab-theme="builtin-theme-retro-y2k"] .eab-button {
  background: linear-gradient(180deg, #4a4aa8, #26265e 52%, #1b1b45);
  border: 1px solid #6a6ad0;
  color: #e6f1ff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.5);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.3) inset, 0 0 10px rgba(0, 229, 255, 0.18);
}
html[data-eab-theme="builtin-theme-retro-y2k"] .btn:hover,
html[data-eab-theme="builtin-theme-retro-y2k"] .eab-button:hover:not(:disabled) {
  border-color: #00e5ff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset, 0 0 16px rgba(0, 229, 255, 0.45);
}
html[data-eab-theme="builtin-theme-retro-y2k"] .btn-primary,
html[data-eab-theme="builtin-theme-retro-y2k"] .eab-button-primary {
  background: linear-gradient(180deg, #00e5ff, #00a8c4);
  border-color: #7cf6ff;
  color: #04121a;
  font-weight: 800;
  text-shadow: none;
  box-shadow: 0 0 18px rgba(0, 229, 255, 0.55);
}
html[data-eab-theme="builtin-theme-retro-y2k"] .taskbar-tab.active {
  background: linear-gradient(180deg, #00e5ff, #00a8c4);
  border-color: #7cf6ff;
  color: #04121a;
  box-shadow: 0 0 14px rgba(0, 229, 255, 0.55);
}
html[data-eab-theme="builtin-theme-retro-y2k"] .menu-dropdown {
  background: linear-gradient(180deg, #1d1d4d, #10102a);
  border: 1px solid #00e5ff;
  box-shadow: 0 0 22px rgba(0, 229, 255, 0.35);
}`
  },
  "builtin-theme-liquid-glass": {
    "variables": {
      "--eab-bg": "#05070d",
      "--eab-surface": "rgba(255, 255, 255, 0.055)",
      "--eab-sidebar-bg": "rgba(255, 255, 255, 0.04)",
      "--eab-menubar-bg": "rgba(255, 255, 255, 0.05)",
      "--eab-taskbar-bg": "rgba(255, 255, 255, 0.04)",
      "--eab-statusbar-bg": "rgba(255, 255, 255, 0.04)",
      "--eab-card-bg": "rgba(255, 255, 255, 0.07)",
      "--eab-input-bg": "rgba(255, 255, 255, 0.09)",
      "--eab-border": "rgba(255, 255, 255, 0.16)",
      "--eab-text": "#eef4ff",
      "--eab-text-dim": "#9fb0c9",
      "--eab-accent": "#7dd3fc",
      "--eab-accent-hover": "#5cc0ee",
      "--eab-on-accent": "#04121a",
      "--eab-hover": "rgba(125, 211, 252, 0.12)",
      "--eab-danger": "#ff6b81",
      "--eab-success": "#5eead4",
      "--eab-warning": "#fcd34d",
      "--eab-info": "#7dd3fc",
      "--eab-radius": "18px",
      "--eab-radius-sm": "12px",
      "--eab-radius-xl": "26px",
      "--eab-shadow-1": "0 1px 0 rgba(255, 255, 255, 0.22) inset, 0 -1px 0 rgba(255, 255, 255, 0.06) inset, 0 10px 30px rgba(0, 0, 0, 0.45)",
      "--eab-shadow-2": "0 1px 0 rgba(255, 255, 255, 0.3) inset, 0 24px 60px rgba(0, 0, 0, 0.55)",
      "--eab-ring": "0 0 0 3px rgba(125, 211, 252, 0.30)",
      "--eab-control-radius": "12px"
    },
    "styles": `/* Liquid glass: a dark pool with light refracting through the chrome.
   Specular top edge, soft inner glow, heavy blur behind every pane. */
html[data-eab-theme="builtin-theme-liquid-glass"] body {
  background:
    radial-gradient(50% 40% at 15% 0%, rgba(56, 189, 248, 0.30), transparent 65%),
    radial-gradient(45% 40% at 85% 10%, rgba(167, 139, 250, 0.26), transparent 65%),
    radial-gradient(60% 50% at 50% 100%, rgba(45, 212, 191, 0.18), transparent 70%),
    #05070d;
  background-attachment: fixed;
}
html[data-eab-theme="builtin-theme-liquid-glass"] .eab-menubar,
html[data-eab-theme="builtin-theme-liquid-glass"] .eab-toolbar-row,
html[data-eab-theme="builtin-theme-liquid-glass"] .eab-statusbar,
html[data-eab-theme="builtin-theme-liquid-glass"] .eab-left-panel,
html[data-eab-theme="builtin-theme-liquid-glass"] .card,
html[data-eab-theme="builtin-theme-liquid-glass"] .menu-dropdown {
  background: rgba(255, 255, 255, 0.055);
  backdrop-filter: blur(26px) saturate(180%);
  -webkit-backdrop-filter: blur(26px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.28) inset, 0 -1px 0 rgba(255, 255, 255, 0.06) inset, 0 14px 40px rgba(0, 0, 0, 0.45);
}
html[data-eab-theme="builtin-theme-liquid-glass"] .card {
  border-radius: 18px;
  position: relative;
  overflow: hidden;
}
html[data-eab-theme="builtin-theme-liquid-glass"] .card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 45%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.10), transparent);
  pointer-events: none;
}
html[data-eab-theme="builtin-theme-liquid-glass"] .card-title {
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 0.01em;
}
html[data-eab-theme="builtin-theme-liquid-glass"] input,
html[data-eab-theme="builtin-theme-liquid-glass"] select,
html[data-eab-theme="builtin-theme-liquid-glass"] textarea {
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.18) inset;
}
html[data-eab-theme="builtin-theme-liquid-glass"] .btn,
html[data-eab-theme="builtin-theme-liquid-glass"] .eab-button {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.20);
  border-radius: 12px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.25) inset;
}
html[data-eab-theme="builtin-theme-liquid-glass"] .btn:hover,
html[data-eab-theme="builtin-theme-liquid-glass"] .eab-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(125, 211, 252, 0.55);
}
html[data-eab-theme="builtin-theme-liquid-glass"] .btn-primary,
html[data-eab-theme="builtin-theme-liquid-glass"] .eab-button-primary {
  background: linear-gradient(160deg, rgba(125, 211, 252, 0.95), rgba(94, 234, 212, 0.85));
  border-color: rgba(255, 255, 255, 0.45);
  color: #04121a;
  font-weight: 650;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset, 0 10px 26px rgba(125, 211, 252, 0.28);
}
html[data-eab-theme="builtin-theme-liquid-glass"] .taskbar-tab.active {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.35);
  color: #ffffff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset;
}`
  },
  "builtin-theme-flat": {
    "variables": {
      "--eab-bg": "#f4f6f8",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#ffffff",
      "--eab-menubar-bg": "#2f6fed",
      "--eab-taskbar-bg": "#2f6fed",
      "--eab-statusbar-bg": "#e9edf2",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#ffffff",
      "--eab-border": "#dfe3e8",
      "--eab-text": "#1f2933",
      "--eab-text-dim": "#6b7785",
      "--eab-accent": "#2f6fed",
      "--eab-accent-hover": "#2559c9",
      "--eab-on-accent": "#ffffff",
      "--eab-hover": "rgba(47, 111, 237, 0.08)",
      "--eab-danger": "#d64545",
      "--eab-success": "#2f9e44",
      "--eab-warning": "#e0a020",
      "--eab-info": "#2f6fed",
      "--eab-radius": "4px",
      "--eab-radius-sm": "3px",
      "--eab-radius-xl": "6px",
      "--eab-shadow-1": "none",
      "--eab-shadow-2": "none",
      "--eab-ring": "0 0 0 2px rgba(47, 111, 237, 0.35)",
      "--eab-control-radius": "4px"
    },
    "styles": `/* Flat design: solid fills, no gradients, no shadows, no bevels.
   Hierarchy comes from colour and weight alone. */
html[data-eab-theme="builtin-theme-flat"] body {
  background: #f4f6f8;
}
html[data-eab-theme="builtin-theme-flat"] .eab-menubar,
html[data-eab-theme="builtin-theme-flat"] .eab-toolbar-row {
  background: #2f6fed;
  border-bottom: none;
  color: #ffffff;
}
html[data-eab-theme="builtin-theme-flat"] .eab-menubar .menubar-nav-item,
html[data-eab-theme="builtin-theme-flat"] .eab-menubar .menubar-brand,
html[data-eab-theme="builtin-theme-flat"] .eab-toolbar-row .toolbar-btn {
  color: #ffffff;
}
html[data-eab-theme="builtin-theme-flat"] .eab-menubar .menubar-nav-item:hover,
html[data-eab-theme="builtin-theme-flat"] .eab-toolbar-row .toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}
html[data-eab-theme="builtin-theme-flat"] .eab-statusbar {
  background: #e9edf2;
  border-top: 1px solid #dfe3e8;
}
html[data-eab-theme="builtin-theme-flat"] .card,
html[data-eab-theme="builtin-theme-flat"] .eab-left-panel {
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 4px;
  box-shadow: none;
}
html[data-eab-theme="builtin-theme-flat"] .card-title {
  color: #1f2933;
  font-weight: 600;
}
html[data-eab-theme="builtin-theme-flat"] input,
html[data-eab-theme="builtin-theme-flat"] select,
html[data-eab-theme="builtin-theme-flat"] textarea {
  background: #ffffff;
  border: 1px solid #cfd6de;
  border-radius: 4px;
  box-shadow: none;
}
html[data-eab-theme="builtin-theme-flat"] input:focus,
html[data-eab-theme="builtin-theme-flat"] select:focus,
html[data-eab-theme="builtin-theme-flat"] textarea:focus {
  border-color: #2f6fed;
  box-shadow: none;
}
html[data-eab-theme="builtin-theme-flat"] .btn,
html[data-eab-theme="builtin-theme-flat"] .eab-button {
  background: #eef1f5;
  border: 1px solid transparent;
  border-radius: 4px;
  box-shadow: none;
  color: #1f2933;
  font-weight: 550;
}
html[data-eab-theme="builtin-theme-flat"] .btn:hover,
html[data-eab-theme="builtin-theme-flat"] .eab-button:hover:not(:disabled) {
  background: #e2e7ee;
  border-color: transparent;
}
html[data-eab-theme="builtin-theme-flat"] .btn-primary,
html[data-eab-theme="builtin-theme-flat"] .eab-button-primary {
  background: #2f6fed;
  border-color: #2f6fed;
  color: #ffffff;
}
html[data-eab-theme="builtin-theme-flat"] .btn-primary:hover,
html[data-eab-theme="builtin-theme-flat"] .eab-button-primary:hover:not(:disabled) {
  background: #2559c9;
  border-color: #2559c9;
}
html[data-eab-theme="builtin-theme-flat"] .taskbar-tab {
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.82);
}
html[data-eab-theme="builtin-theme-flat"] .taskbar-tab:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}
html[data-eab-theme="builtin-theme-flat"] .taskbar-tab.active {
  background: #ffffff;
  border-color: #ffffff;
  color: #2f6fed;
}
html[data-eab-theme="builtin-theme-flat"] .menu-dropdown {
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 4px;
  box-shadow: none;
}`
  },
  "builtin-theme-legacy": {
    "variables": {
      "--eab-bg": "#ffffff",
      "--eab-surface": "#ffffff",
      "--eab-sidebar-bg": "#ffffff",
      "--eab-menubar-bg": "#ffffff",
      "--eab-taskbar-bg": "#ffffff",
      "--eab-statusbar-bg": "#ffffff",
      "--eab-card-bg": "#ffffff",
      "--eab-input-bg": "#ffffff",
      "--eab-border": "#808080",
      "--eab-text": "#000000",
      "--eab-text-dim": "#838383",
      "--eab-accent": "#ff5a00",
      "--eab-accent-hover": "rgb(0, 170, 127)",
      "--eab-hover": "rgba(255, 90, 0, 0.125)",
      "--eab-danger": "#ff0000",
      "--eab-success": "rgb(0, 170, 127)",
      "--eab-warning": "rgb(255, 128, 0)",
      "--eab-info": "rgb(0, 159, 193)",
      "--eab-qt-window": "#ffffff",
      "--eab-qt-base": "#ffffff",
      "--eab-qt-border": "gray",
      "--eab-qt-pane-border": "lightgray",
      "--eab-qt-text": "#000000",
      "--eab-qt-text-dim": "rgb(131, 131, 131)",
      "--eab-qt-accent": "#ff5a00",
      "--eab-qt-tab-active": "rgb(0, 159, 193)",
      "--eab-qt-tab-hover": "rgb(0, 170, 127)",
      "--eab-qt-focus": "rgb(0, 170, 255)",
      "--eab-qt-highlight": "rgba(255, 90, 0, 0.196)",
      "--eab-qt-disabled-base": "#e6e6e6",
      "--eab-qt-control-gradient": "linear-gradient(to bottom,\r\n    rgba(225, 225, 225, 0.63), rgba(221, 221, 221, 0.63) 50%,\r\n    rgba(216, 216, 216, 0.5) 50%, rgba(211, 211, 211, 0.19))",
      "--eab-control-h": "26px",
      "--eab-control-radius": "3px",
      "--eab-control-font-size": "13px"
    },
    "styles": "/* The legacy theme retunes the control rule set with tokens alone: Windows line\r\n   edits sit at ~26px, native push buttons are near-square and 15px. */\r\n\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .card table {\r\n  font-size: 15px;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .card thead th {\r\n  font-size: 15px;\r\n  font-weight: 700;\r\n  letter-spacing: 0;\r\n  text-transform: none;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] body, html[data-eab-theme=\"builtin-theme-legacy\"] button, html[data-eab-theme=\"builtin-theme-legacy\"] input, html[data-eab-theme=\"builtin-theme-legacy\"] select, html[data-eab-theme=\"builtin-theme-legacy\"] textarea, html[data-eab-theme=\"builtin-theme-legacy\"] .app-container {\r\n  font-family: 'Segoe UI', Tahoma, 'MS Shell Dlg 2', Verdana, sans-serif;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] body {\r\n  font-size: 15px;\r\n  line-height: 1.35;\r\n}\r\n\r\n/* Sections are rules, not boxes — the reference's `Line` idiom. */\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .card {\r\n  border-radius: 0;\r\n  background: transparent;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .card-title {\r\n  font-size: 15px;\r\n  font-weight: 700;\r\n  color: #000000;\r\n}\r\n\r\n/* Undo the Linear/Vercel uppercase micro-label: Qt draws sentence case. */\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .card-title {\r\n  text-transform: none;\r\n  letter-spacing: 0;\r\n}\r\n\r\n/* ── Native controls ──────────────────────────────────────\r\nWindows line edits: white, 1px inset border, 2px radius. */\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] select {\r\n  background-image: none;\r\n}\r\n\r\n/* Native push buttons are grey.  Qt marks the window's default button\r\nwith a blue frame, which is what the primary action gets here. */\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .btn {\r\n  font-size: var(--eab-control-font-size);\r\n  border-radius: var(--eab-control-radius);\r\n  background: linear-gradient(to bottom, #ffffff, #e6e6e6);\r\n  color: #000000;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .btn:hover {\r\n  background: linear-gradient(to bottom, #ffffff, #ededed);\r\n  border-color: #bcbcbc;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .btn-secondary {\r\n  background: linear-gradient(to bottom, #ffffff, #e6e6e6);\r\n  color: #000000;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .btn-primary {\r\n  font-size: var(--eab-control-font-size) !important;\r\n  font-weight: 400;\r\n  background: linear-gradient(to bottom, #ffffff, #e6e6e6);\r\n  color: #000000;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .btn-primary:hover {\r\n  background: linear-gradient(to bottom, #ffffff, #ededed);\r\n}\r\n\r\n/* The reference has no sticky footer; keep the bar inline and flat. */\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .action-bar {\r\n  box-shadow: none;\r\n  background: transparent;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .app-header h1 {\r\n  font-size: 15px;\r\n  font-weight: 700;\r\n  color: #000000;\r\n}\r\n\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .app-header p {\r\n  font-size: 15px;\r\n  font-weight: 700;\r\n  color: #000000;\r\n}\r\n\r\n/* Sentence case, matching the other section headings in this mode. */\r\n\r\n/* Result metrics are plain text in the reference, not micro-labels. */\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .stat-label {\r\n  font-size: 11px;\r\n  font-weight: 400;\r\n  text-transform: none;\r\n  letter-spacing: 0;\r\n  color: #5a5a5a;\r\n}\r\nhtml[data-eab-theme=\"builtin-theme-legacy\"] .hint {\r\n  font-size: 13px;\r\n  color: #5a5a5a;\r\n}"
  }
};

  window.EAB_THEME_API = {
    list: function () {
      return Object.keys(THEMES);
    },
    css: function (id) {
      var theme = THEMES[id];
      if (!theme) return null;
      return { variables: theme.variables, styles: theme.styles || '' };
    },
  };
})();
