import { Canvas, extend } from "@react-three/fiber";
import { useState, useEffect, useCallback } from "react";
import { OrbitControls, Sky } from "@react-three/drei";
import axios from "axios";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import fontJson from "three/examples/fonts/helvetiker_regular.typeface.json";
import { useParams } from "react-router-dom";

extend({ TextGeometry });

function Ground({ onHover }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.1, 0]}
      onPointerMove={(e) => onHover(e)}
      onClick={(e) => onHover(e, true)}
    >
      <planeGeometry args={[17, 17]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
}

function Rock({ position, size }) {
  return (
    <mesh position={position} scale={size}>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#808080" />
    </mesh>
  );
}

function Tree({ position, woodColor, leafColor, username, opacity = 1 }) {
  const font = new FontLoader().parse(fontJson);

  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color={woodColor} opacity={opacity} transparent={opacity < 1} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={leafColor} opacity={opacity} transparent={opacity < 1} />
      </mesh>
      {username && (
        <mesh position={[0, 1.8, 0]}>
          <textGeometry args={[username, { font, size: 0.1, height: 0.01 }]} />
          <meshStandardMaterial color="white" />
        </mesh>
      )}
    </group>
  );
}

export default function App() {
  const [trees, setTrees] = useState([]);
  const [hoverPos, setHoverPos] = useState(null);
  const [username, setUsername] = useState("Loading...");
  const [woodColor, setWoodColor] = useState("#8B5A2B"); 
  const [leafColor, setLeafColor] = useState("#00FF00"); 
  const { userId } = useParams();

  useEffect(() => {
    axios
      .get(`https://berony-server.onrender.com/api/users/${userId}`)
      .then((response) => {
        if (response.data && response.data.userId) {
          setUsername(response.data.username);
        } else {
          throw new Error("Invalid user data format");
        }
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
      });

    axios
      .get("https://berony-server.onrender.com/api/tree")
      .then((response) => setTrees(response.data))
      .catch((error) => console.error("Error fetching trees:", error));
  }, [userId]);

  const handleHover = useCallback(
    async (e, isClick = false) => {
      const point = e.point;
      const newTree = {
        userId,
        position: [Math.round(point.x), 0, Math.round(point.z)],
        woodColor,
        leafColor,
      };

      if (isClick) {
        try {
          const response = await axios.post("https://berony-server.onrender.com/api/tree", newTree);
          setTrees([...trees, response.data]);
        } catch (error) {
          alert(error.response?.data?.message || "Error adding tree");
        }
      } else {
        setHoverPos(newTree.position);
      }
    },
    [trees, userId, woodColor, leafColor]
  );

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <Canvas
        shadows
        gl={{ antialias: true }}
        camera={{ position: [5, 5, 5], fov: 50 }}
      >
        <Sky sunPosition={[100, 20, 100]} />
        <fog attach="fog" args={["#aabbcc", 5, 30]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <OrbitControls />
        <Rock key={`rock1`} position={[1, 0, 0]} size={0.3} />
        <Rock key={`rock2`} position={[3, 0, 1]} size={0.4} />
        <Rock key={`rock3`} position={[2, 0, -6]} size={0.2} />
        <Rock key={`rock4`} position={[-5, 0, 6]} size={0.5} />
        <Ground onHover={handleHover} />
        {hoverPos && (
          <Tree
            position={hoverPos}
            woodColor={woodColor}
            leafColor={leafColor}
            opacity={0.5}
          />
        )}
        {trees.map((tree, index) => (
          <Tree
            key={index}
            position={tree.position}
            woodColor={tree.woodColor}
            leafColor={tree.leafColor}
            username={tree.username}
          />
        ))}
      </Canvas>
      {/* Color Picker UI */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(255, 255, 255, 0.8)",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <label>
          Wood Color:
          <input
            type="color"
            value={woodColor}
            onChange={(e) => setWoodColor(e.target.value)}
          />
        </label>
        <br />
        <label>
          Leaf Color:
          <input
            type="color"
            value={leafColor}
            onChange={(e) => setLeafColor(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}