import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const currentScene = (_scene: Phaser.Scene) => {
        // Event emitted from the PhaserGame component
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </div>
    )
}

export default App
