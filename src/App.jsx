import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useState, useEffect, useCallback, useRef } from 'react';
import { OrbitControls, Sky } from '@react-three/drei';
import axios from 'axios';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { useParams } from 'react-router-dom';
import fontJson from '../public/fonts/helvetiker_regular.typeface.json';

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

function Flower({ position, petalColor, username, opacity = 1 }) {
  const font = new FontLoader().parse(fontJson);
  const flowerRef = useRef();

  useFrame(({ clock }) => {
    if (flowerRef.current) {
      const t = clock.getElapsedTime();
      flowerRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group position={position} ref={flowerRef}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial
          color="#228B22"
          opacity={opacity}
          transparent={opacity < 1}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          position={[Math.sin((i * Math.PI) / 4) * 0.25, 0.6, Math.cos((i * Math.PI) / 4) * 0.25]}
          rotation={[0, 0, -Math.PI / 4]}
        >
          <coneGeometry args={[0.15, 0.3, 3]} />
          <meshStandardMaterial
            color={petalColor}
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#FFFF00"
          opacity={opacity}
          transparent={opacity < 1}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {username && (
        <mesh position={[0, 1.0, 0]}>
          <textGeometry args={[username, { font, size: 0.1, height: 0.01 }]} />
          <meshStandardMaterial color="white" />
        </mesh>
      )}
    </group>
  );
}

function Bench({ position, woodColor, username, opacity = 1 }) {
  const font = new FontLoader().parse(fontJson);

  return (
    <group position={position}>
      {[...Array(4)].map((_, i) => (
        <mesh
          key={`seat-slat-${i}`}
          position={[-0.75 + i * 0.5, 0.5, 0]}
        >
          <boxGeometry args={[0.45, 0.1, 0.6]} />
          <meshStandardMaterial
            color={woodColor}
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}
      {[...Array(5)].map((_, i) => (
        <mesh
          key={`backrest-slat-${i}`}
          position={[-0.75 + i * 0.375, 0.9, -0.25]}
          rotation={[Math.PI / 8, 0, 0]}
        >
          <boxGeometry args={[0.3, 0.6, 0.05]} />
          <meshStandardMaterial
            color={woodColor}
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}
      {[
        { pos: [-0.85, 0.7, 0], rot: [0, 0, Math.PI / 2] },
        { pos: [0.85, 0.7, 0], rot: [0, 0, -Math.PI / 2] },
      ].map(({ pos, rot }, i) => (
        <mesh key={`armrest-${i}`} position={pos} rotation={rot}>
          <boxGeometry args={[0.6, 0.1, 0.1]} />
          <meshStandardMaterial
            color={woodColor}
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}
      {[
        [-0.85, 0.25, 0.25],
        [0.85, 0.25, 0.25],
        [-0.85, 0.25, -0.25],
        [0.85, 0.25, -0.25],
      ].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial
            color={woodColor}
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}
      {[
        { pos: [-0.85, 0.3, 0], rot: [0, 0, Math.PI / 4], args: [0.4, 0.05, 0.05] },
        { pos: [0.85, 0.3, 0], rot: [0, 0, -Math.PI / 4], args: [0.4, 0.05, 0.05] },
      ].map(({ pos, rot, args }, i) => (
        <mesh key={`brace-${i}`} position={pos} rotation={rot}>
          <boxGeometry args={args} />
          <meshStandardMaterial
            color={woodColor}
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ))}
      {username && (
        <group position={[0, 1.0, -0.3]}>
          <mesh>
            <boxGeometry args={[0.5, 0.15, 0.02]} />
            <meshStandardMaterial
              color="#D4A017"
              opacity={opacity}
              transparent={opacity < 1}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <textGeometry args={[username, { font, size: 0.08, height: 0.005 }]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function SwingSet({ position, frameColor, username, opacity = 1 }) {
  const font = new FontLoader().parse(fontJson);
  const swing1Ref = useRef();
  const swing2Ref = useRef();
  const [swing1Active, setSwing1Active] = useState(false);
  const [swing2Active, setSwing2Active] = useState(false);
  const swing1Data = useRef({ angle: 0, velocity: 0 });
  const swing2Data = useRef({ angle: 0, velocity: 0 });

  useFrame((_, delta) => {
    const damping = 0.98;
    const spring = 0.1;

    if (swing1Active && swing1Ref.current) {
      const { angle, velocity } = swing1Data.current;
      const acceleration = -spring * angle;
      swing1Data.current.velocity = (velocity + acceleration * delta) * damping;
      swing1Data.current.angle += velocity * delta;
      swing1Ref.current.rotation.x = swing1Data.current.angle;
    }

    if (swing2Active && swing2Ref.current) {
      const { angle, velocity } = swing2Data.current;
      const acceleration = -spring * angle;
      swing2Data.current.velocity = (velocity + acceleration * delta) * damping;
      swing2Data.current.angle += velocity * delta;
      swing2Ref.current.rotation.x = swing2Data.current.angle;
    }
  });

  const handleSwingClick = (swingId) => {
    if (swingId === 1) {
      setSwing1Active(true);
      swing1Data.current.velocity = 0.5;
    } else {
      setSwing2Active(true);
      swing2Data.current.velocity = 0.5;
    }
  };

  return (
    <group position={position}>
      {[
        { pos: [-1.5, 1, 0], rot: [0, 0, Math.PI / 6] },
        { pos: [1.5, 1, 0], rot: [0, 0, -Math.PI / 6] },
      ].map(({ pos, rot }, i) => (
        <mesh key={`support-${i}`} position={pos} rotation={rot}>
          <cylinderGeometry args={[0.05, 0.05, 2.2, 16]} />
          <meshStandardMaterial
            color={frameColor}
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>
      ))}
      <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 3.2, 16]} />
        <meshStandardMaterial
          color={frameColor}
          opacity={opacity}
          transparent={opacity < 1}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      <group ref={swing1Ref} position={[-0.5, 2, 0]} onClick={() => handleSwingClick(1)}>
        {[
          [-0.2, -0.5, 0],
          [0.2, -0.5, 0],
        ].map((pos, i) => (
          <mesh key={`chain1-${i}`} position={pos}>
            <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
            <meshStandardMaterial
              color="#AAAAAA"
              opacity={opacity}
              transparent={opacity < 1}
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>
        ))}
        <mesh position={[0, -1, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.3]} />
          <meshStandardMaterial
            color="#FF5555"
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      </group>
      <group ref={swing2Ref} position={[0.5, 2, 0]} onClick={() => handleSwingClick(2)}>
        {[
          [-0.2, -0.5, 0],
          [0.2, -0.5, 0],
        ].map((pos, i) => (
          <mesh key={`chain2-${i}`} position={pos}>
            <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
            <meshStandardMaterial
              color="#AAAAAA"
              opacity={opacity}
              transparent={opacity < 1}
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>
        ))}
        <mesh position={[0, -1, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.3]} />
          <meshStandardMaterial
            color="#FF5555"
            opacity={opacity}
            transparent={opacity < 1}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      </group>
      {username && (
        <group position={[0, 2.1, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.15, 0.02]} />
            <meshStandardMaterial
              color="#D4A017"
              opacity={opacity}
              transparent={opacity < 1}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <textGeometry args={[username, { font, size: 0.08, height: 0.005 }]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [hoverPos, setHoverPos] = useState(null);
  const [username, setUsername] = useState('Loading...');
  const [woodColor, setWoodColor] = useState('#8B5A2B');
  const [leafColor, setLeafColor] = useState('#00FF00');
  const [selectedItem, setSelectedItem] = useState('tree');
  const { userId } = useParams();

  useEffect(() => {
    axios
      .get(`https://berony-server.onrender.com/api/user/${userId}`)
      .then((response) => {
        if (response.data && response.data.user && response.data.user.userId) {
          setUsername(response.data.user.username);
        } else {
          throw new Error('Invalid user data format');
        }
      })
      .catch((error) => {
        console.error('Error fetching user:', error);
        setUsername('Guest');
      });

    axios
      .get('https://berony-server.onrender.com/api/items')
      .then((response) => {
        console.log('Fetched items:', response.data);
        setItems(response.data);
      })
      .catch((error) => console.error('Error fetching items:', error));
  }, [userId]);

  const handleHover = useCallback(
    async (e, isClick = false) => {
      const point = e.point;
      console.log('Selected item:', selectedItem);
      const newItem = {
        userId,
        itemType: selectedItem,
        position: [Math.round(point.x), 0, Math.round(point.z)],
        woodColor: ['tree', 'bench', 'swingSet'].includes(selectedItem) ? woodColor : null,
        leafColor: ['tree', 'flower'].includes(selectedItem) ? leafColor : null,
        username,
      };

      if (isClick) {
        console.log('Posting item:', newItem);
        try {
          const response = await axios.post('https://berony-server.onrender.com/api/items', newItem);
          console.log('Posted item response:', response.data);
          setItems((prevItems) => [...prevItems, response.data]);
        } catch (error) {
          console.error('Error adding item:', error.response?.data?.message || error.message);
          // alert(error.response?.data?.message || 'Error adding item');
        }
      } else {
        setHoverPos(newItem.position);
      }
    },
    [selectedItem, userId, woodColor, leafColor, username]
  );

  const renderPreviewItem = () => {
    if (!hoverPos) return null;
    switch (selectedItem) {
      case 'tree':
        return <Tree position={hoverPos} woodColor={woodColor} leafColor={leafColor} opacity={0.5} />;
      case 'flower':
        return <Flower position={hoverPos} petalColor={leafColor} opacity={0.5} />;
      case 'bench':
        return <Bench position={hoverPos} woodColor={woodColor} opacity={0.5} />;
      case 'swingSet':
        return <SwingSet position={hoverPos} frameColor={woodColor} opacity={0.5} />;
      default:
        return null;
    }
  };

  const renderItem = (item, index) => {
    console.log('Rendering item:', item);
    const itemType = item.itemType;
    if (!itemType) return null;

    switch (itemType) {
      case 'tree':
        return (
          <Tree
            key={index}
            position={item.position}
            woodColor={item.woodColor || '#8B5A2B'}
            leafColor={item.leafColor || '#00FF00'}
            username={item.username}
          />
        );
      case 'flower':
        return (
          <Flower
            key={index}
            position={item.position}
            petalColor={item.leafColor || '#00FF00'}
            username={item.username}
          />
        );
      case 'bench':
        return (
          <Bench
            key={index}
            position={item.position}
            woodColor={item.woodColor || '#8B5A2B'}
            username={item.username}
          />
        );
      case 'swingSet':
        return (
          <SwingSet
            key={index}
            position={item.position}
            frameColor={item.woodColor || '#8B5A2B'}
            username={item.username}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <Canvas shadows gl={{ antialias: true }} camera={{ position: [5, 5, 5], fov: 50 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <fog attach="fog" args={['#aabbcc', 5, 30]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <OrbitControls />
        <Rock key="rock1" position={[1, 0, 0]} size={0.3} />
        <Rock key="rock2" position={[3, 0, 1]} size={0.4} />
        <Rock key="rock3" position={[2, 0, -6]} size={0.2} />
        <Rock key="rock4" position={[-5, 0, 6]} size={0.5} />
        <Ground onHover={handleHover} />
        {renderPreviewItem()}
        {items.map(renderItem)}
      </Canvas>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <label>
          Item Type:
          <select
            value={selectedItem}
            onChange={(e) => {
              console.log('Selected item changed to:', e.target.value);
              setSelectedItem(e.target.value);
            }}
            style={{ margin: '5px 0' }}
          >
            <option value="tree">Tree</option>
            <option value="flower">Flower</option>
            <option value="bench">Bench</option>
            <option value="swingSet">Swing Set</option>
          </select>
        </label>
        <br />
        {(selectedItem === 'tree' || selectedItem === 'bench' || selectedItem === 'swingSet') && (
          <label>
            {selectedItem === 'tree' ? 'Wood Color:' : selectedItem === 'bench' ? 'Wood Color:' : 'Frame Color:'}
            <input
              type="color"
              value={woodColor}
              onChange={(e) => setWoodColor(e.target.value)}
              style={{ margin: '5px 0' }}
            />
          </label>
        )}
        <br />
        {(selectedItem === 'tree' || selectedItem === 'flower') && (
          <label>
            {selectedItem === 'tree' ? 'Leaf Color:' : 'Petal Color:'}
            <input
              type="color"
              value={leafColor}
              onChange={(e) => setLeafColor(e.target.value)}
              style={{ margin: '5px 0' }}
            />
          </label>
        )}
      </div>
    </div>
  );
}