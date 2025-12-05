# Mermaid Preview Controls

## Mouse & Trackpad Controls

The Mermaid diagram preview supports intuitive controls for navigation and zooming:

### Scrolling (Panning)
- **Mouse Wheel / Trackpad Scroll**: Pan the diagram vertically and horizontally
- **Vertical Scroll**: Moves diagram up/down
- **Horizontal Scroll**: Moves diagram left/right (two-finger scroll on trackpad)

### Zooming
- **Ctrl/Cmd + Scroll**: Zoom in and out
  - Scroll up: Zoom in (up to 300%)
  - Scroll down: Zoom out (down to 25%)
- **Zoom Buttons**: Use the toolbar buttons for discrete zoom steps
  - `-` button: Zoom out by 25%
  - `+` button: Zoom in by 25%
  - Percentage display: Shows current zoom level

### Dragging (Manual Pan)
- **Left Click + Drag**: Pan the diagram while holding mouse button
- **Cursor Feedback**: Changes to indicate grabbing state

### Reset
- **Reset Button**: Returns diagram to 100% zoom and centered position
- **Keyboard**: No keyboard shortcut (toolbar button only)

### Export
- **Download Button**: Saves the rendered diagram as SVG file
  - Preserves current state (zoom and position are not included in export)
  - Useful for sharing or printing

## Toolbar Location
The control toolbar is positioned in the **top-right corner** of the preview area with:
- Zoom out button (-)
- Current zoom percentage
- Zoom in button (+)
- Reset view button (↺)
- Download/Export button (↓)

## User Experience

### For Desktop Users
- **Two-finger trackpad scroll**: Natural panning gesture
- **Ctrl/Cmd + scroll**: Familiar zoom shortcut
- **Click and drag**: Quick manual pan when needed

### For Tablet/Trackpad Users
- **Vertical scroll**: Pan up/down
- **Horizontal scroll**: Pan left/right (if trackpad supports)
- **Pinch gesture**: Not currently supported (use Ctrl/Cmd + scroll alternative)

## Implementation Details

File: `src/components/editor/MermaidPreview.tsx`

### Scroll Behavior
```typescript
// Regular scroll: Pan the diagram
setPosition(prev => ({
  x: prev.x - e.deltaX * panSpeed,
  y: prev.y - e.deltaY * panSpeed,
}));

// Ctrl/Cmd + scroll: Zoom
if (e.ctrlKey || e.metaKey) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  setScale(prev => Math.max(0.25, Math.min(3, prev + delta)));
}
```

### Zoom Constraints
- Minimum zoom: 25% (0.25x)
- Maximum zoom: 300% (3x)
- Zoom increment: 25% per toolbar button
- Smooth transitions: 0.1s ease-out animation when not dragging

## Future Enhancements

Possible improvements:
- Pinch-to-zoom gesture support for touch devices
- Keyboard shortcuts (arrow keys for panning, +/- for zoom)
- Double-click to reset view
- Mouse wheel velocity-based zoom (faster scroll = more zoom)
- Scroll wheel direction detection for alternative pan modes
