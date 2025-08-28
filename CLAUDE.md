# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

The user runs `bun dev` in a separate terminal session for development. Other essential commands:

- `bun run build` - Build for production (runs TypeScript check + Vite build)
- `bun run lint` - Run ESLint with TypeScript extensions
- `bun run lint:fix` - Auto-fix ESLint issues
- `bun run format` - Format code with Prettier
- `bun run format:check` - Check code formatting
- `bun run preview` - Preview production build

## Architecture Overview

This is an SVG path editor built with React, TypeScript, Vite, and Tailwind CSS. The application follows a modular architecture:

### Core State Management
- **Zustand store** (`src/stores/editor-store.ts`) - Centralized state for editor, viewport, paths, and reference images
- **Zustand middleware** - Uses `subscribeWithSelector` for granular state subscriptions
- **State structure**: Editor tools, selected paths/points, zoom/pan, grid settings, SVG paths, reference images

### Key Architectural Components

**SVG Viewport System** (`src/components/svg-editor/`):
- `svg-viewport.tsx` - Main SVG container with transform handling, grid system, and mouse event coordination
- `use-viewport/index.ts` - Custom hook managing zoom, pan, coordinate transformations, global mouse events
- Global mouse event listeners ensure panning works reliably when cursor leaves SVG area
- Space key + drag for panning across all tools

**Drawing System**:
- `drawing-overlay.tsx` - Interactive path creation overlay
- `use-drawing/index.ts` - Drawing logic and path construction
- `path-renderer.tsx` - Renders SVG paths from command data
- `path-parser.ts` - Converts SVG path strings to structured commands

**Tool System**:
- Tools: select, pen, bezier, pan, zoom
- Tool-specific cursor styling and behavior
- Keyboard shortcuts and mouse interactions per tool

### Data Flow
1. User interactions → viewport hooks → Zustand store updates
2. Store changes → React re-renders → SVG DOM updates
3. Path data stored as structured commands, not strings
4. Coordinate system: screen coordinates ↔ SVG coordinates via transforms

### Key Technical Patterns
- **Custom hooks** for complex viewport and drawing logic
- **Functional components** with TypeScript interfaces
- **Coordinate transformation** between screen space and SVG space
- **Event delegation** with global document listeners for reliable mouse handling
- **Modular export system** for SVG/PNG/React component generation

### Project Structure
- `src/components/` - UI components (svg-editor/, ui/, panels, toolbars)
- `src/hooks/` - Custom React hooks for viewport and drawing
- `src/stores/` - Zustand state management
- `src/utils/` - Utilities for SVG parsing, canvas operations, exports
- `src/types/` - TypeScript type definitions

## Code Style and Structure
- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.

## Naming Conventions
- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

## TypeScript Usage
- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps instead.
- Use functional components with TypeScript interfaces.

## Syntax and Formatting
- Use the "function" keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.

## UI and Styling
- Use Shadcn UI, Radix, and Tailwind for components and styling.
- Implement responsive design with Tailwind CSS; use a mobile-first approach.
- Performance Optimization
- Minimize 'use client', 'useEffect', and 'setState'
- Wrap client components in Suspense with fallback.
- Use dynamic loading for non-critical components.
- Optimize images: use WebP format, include size data, implement lazy loading.

Please bare in mind that I already and always running my development with bun dev in the separate terminal/session.
- use lucide icons for icons