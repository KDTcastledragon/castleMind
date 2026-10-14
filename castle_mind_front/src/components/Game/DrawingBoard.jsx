import { useEffect, useRef, useState } from "react";

function DrawingBoard() {
    const canvasRef = useRef(null);
    const historyRef = useRef([]);

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [mode, setMode] = useState("pen");

    const getPosition = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const saveHistory = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyRef.current.push(imageData);
    };

    const undo = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const previous = historyRef.current.pop();

        if (!previous) return;

        ctx.putImageData(previous, 0, 0);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === "z") {
                e.preventDefault();
                undo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const startDrawing = (e) => {
        saveHistory();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const { x, y } = getPosition(e);

        ctx.beginPath();
        ctx.moveTo(x, y);

        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const { x, y } = getPosition(e);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (mode === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = 24;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        saveHistory();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div>
            <div>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />

                <button onClick={() => setMode("pen")}>펜</button>
                <button onClick={() => setMode("eraser")}>지우개</button>
                <button onClick={undo}>되돌리기</button>
                <button onClick={clearCanvas}>전체 지우기</button>
            </div>

            <canvas
                ref={canvasRef}
                width={800}
                height={500}
                style={{
                    border: "1px solid #ccc",
                    cursor: mode === "eraser" ? "grab" : "crosshair",
                    background: "white",
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />
        </div>
    );
}

export default DrawingBoard;