import type { ReactNode } from 'react'
import {
    Group,
    Panel,
    Separator,
    useDefaultLayout,
} from 'react-resizable-panels'

const LEFT_PANEL_DEFAULT_SIZE = 240
const LEFT_PANEL_MIN_SIZE = 240
const LEFT_PANEL_MAX_SIZE = 360
const PANEL_GROUP_ID = 'main-layout-panels'
const LEFT_PANEL_ID = 'main-layout-left-panel'
const RIGHT_PANEL_ID = 'main-layout-right-panel'
const PANEL_IDS = [LEFT_PANEL_ID, RIGHT_PANEL_ID]

interface ResizablePanelsProps {
    leftPanel: ReactNode
    rightPanel: ReactNode
}

const ResizablePanels = ({ leftPanel, rightPanel }: ResizablePanelsProps) => {
    const { defaultLayout, onLayoutChanged } = useDefaultLayout({
        id: PANEL_GROUP_ID,
        onlySaveAfterUserInteractions: true,
        panelIds: PANEL_IDS,
    })

    return (
        <Group
            defaultLayout={defaultLayout}
            id={PANEL_GROUP_ID}
            onLayoutChanged={onLayoutChanged}
        >
            <Panel
                className="relative"
                defaultSize={LEFT_PANEL_DEFAULT_SIZE}
                groupResizeBehavior="preserve-pixel-size"
                id={LEFT_PANEL_ID}
                maxSize={LEFT_PANEL_MAX_SIZE}
                minSize={LEFT_PANEL_MIN_SIZE}
            >
                {leftPanel}
            </Panel>
            <Separator
                aria-label="Resize panels"
                className="w-px bg-(--mantine-color-default-border)"
            />
            <Panel className="relative" id={RIGHT_PANEL_ID}>
                {rightPanel}
            </Panel>
        </Group>
    )
}

export default ResizablePanels
