# Style Guidelines - Weekly Planner

## Aesthetic: Modern, Friendly & Intuitive
The application follows a fresh, modern, and highly visual aesthetic focused on health and organization.

### Typography
- **Primary Font**: Inter (Sans-serif) for general UI.
- **Headings**: Black (900) Inter with tight tracking for a bold, confident look.
- **Micro-labels**: Black (900) uppercase with wide tracking (`tracking-widest`) for clear hierarchy.

### Colors
- **Background**: `bg-slate-50` (Light) / `bg-slate-950` (Dark).
- **Brand (Primary)**: Salmon (`rose-500`) for main actions and active states.
- **Day Cards**: White (`bg-white`) / `bg-slate-900` (Dark) with soft borders (`border-slate-100` / `border-slate-800`) and generous rounding (`rounded-[2.5rem]`).
- **Meal Coding (Soft Backgrounds)**:
  - **Breakfast**: `bg-amber-50` / `dark:bg-amber-900/10` (Warm/Morning).
  - **Lunch**: `bg-rose-50` / `dark:bg-rose-900/10` (Fresh/Midday).
  - **Dinner**: `bg-indigo-50` / `dark:bg-indigo-900/10` (Calm/Evening).
  - **Notes**: `bg-slate-50` / `dark:bg-slate-800/50` (Neutral).

### Layout & Spacing
- **Cards**: Extra large rounded corners (`rounded-[2.5rem]`).
- **Shadows**: Subtle `shadow-sm`, elevating to `shadow-xl` on hover. Dark mode uses minimal shadows or subtle borders.
- **Grid**: 
  - **Desktop**: Horizontal scrollable track with snap-align and custom thin scrollbars.
  - **Mobile**: Vertical feed with accordions.

### Components
- **Buttons**: Bold, rounded (`rounded-2xl`), with shadow feedback.
- **Inputs**: Minimalist, often borderless or with very soft borders, focusing on `focus:ring-rose-500`.
- **Navbar**: Modern, transparent background for selected items with a vertical indicator bar.
- **Transitions**: Motion for staggered entrances and smooth state changes.
- **Dark Mode**: Persistent toggle in the header, respecting system preferences by default.

### Iconography & Emojis
- **Icons**: Lucide React for functional clarity.
- **Emojis**: Used strategically to add a human touch and speed up recognition (🍳, 🥗, 🌙, 📝, 🛒).

### Formatting
- **Dates**: `dd MMM` (e.g., 12 Abr).
- **Time**: 24-hour format.
