import * as THREE from "three";
import { useRef, useState, useEffect } from "react";
import { Canvas, extend, useThree, useFrame } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { OrbitControls, Text3D, RoundedBox } from "@react-three/drei";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import { TextureLoader } from "three";

extend({ MeshLineGeometry, MeshLineMaterial });

function BeronyIDCard({ userData }) {
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const { width, height } = useThree((state) => state.size);
  const [curve] = useState(() =>
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ])
  );
  const [dragged, setDragged] = useState(false);
  const dragOffset = useRef(new THREE.Vector3());
  const [logoTexture, setLogoTexture] = useState(null);
  const [emojiTexture, setEmojiTexture] = useState(null);
  const [profileTexture, setProfileTexture] = useState(null);

  // Load logo texture
  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      "/logo.png",
      (texture) => setLogoTexture(texture),
      undefined,
      (error) => console.error("Error loading logo texture:", error)
    );
  }, []);

  // Load profile image texture
  useEffect(() => {
    if (userData.imageurl) {
      const loader = new TextureLoader();
      loader.load(
        userData.imageurl,
        (texture) => setProfileTexture(texture),
        undefined,
        (error) => console.error("Error loading profile texture:", error)
      );
    }
  }, [userData.imageurl]);

  // Create emoji texture
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    context.fillStyle = "transparent";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "100px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#fff";
    context.fillText(userData.userEmotion || "😊", 64, 64);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    setEmojiTexture(texture);

    return () => texture.dispose();
  }, [userData.userEmotion]);

  // Physics joints for the lanyard
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]);

  useFrame((state) => {
    if (dragged && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      const targetPos = vec.sub(dragOffset.current);
      card.current.setNextKinematicTranslation({
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
      });
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
    }
    if (fixed.current && band.current) {
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.translation());
      curve.points[2].copy(j1.current.translation());
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    const cardPos = card.current.translation();
    vec.set(e.point.x, e.point.y, e.point.z);
    dragOffset.current.copy(vec).sub(cardPos);
    setDragged(true);
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    setDragged(false);
  };

  // Bio truncation logic
  const bioText = userData.userBio || "No bio";
  const maxCharsPerLine = 15;
  const words = bioText.split(" ");
  let line1 = "";
  let line2 = "";
  let remaining = "";

  for (const word of words) {
    if (line1.length + word.length <= maxCharsPerLine && !line2) {
      line1 += (line1 ? " " : "") + word;
    } else if (line2.length + word.length <= maxCharsPerLine) {
      line2 += (line2 ? " " : "") + word;
    } else {
      remaining += (remaining ? " " : "") + word;
    }
  }

  const displayLine1 = line1 || bioText.slice(0, maxCharsPerLine);
  const displayLine2 = line2 || (bioText.length > maxCharsPerLine ? bioText.slice(maxCharsPerLine, maxCharsPerLine * 2) : "");
  const showEllipsis = remaining || bioText.length > maxCharsPerLine * 2;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} angularDamping={2} linearDamping={2} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} angularDamping={2} linearDamping={2}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} angularDamping={2} linearDamping={2}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} angularDamping={2} linearDamping={2}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          angularDamping={2}
          linearDamping={2}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <RoundedBox
            args={[1.6, 2.25, 0.01]}
            smoothness={4}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <meshStandardMaterial
              metalness={0.8}
              roughness={0.2}
              color="#silver"
              envMapIntensity={1.5}
              side={THREE.DoubleSide}
            />
            {emojiTexture && (
              <mesh position={[0.6, 0.94, 0.015]}>
                <planeGeometry args={[0.2, 0.2]} />
                <meshBasicMaterial map={emojiTexture} transparent side={THREE.DoubleSide} />
              </mesh>
            )}
            <Text3D
              position={[-0.7, 0.5, 0.02]}
              font="/fonts/helvetiker_regular.typeface.json"
              size={0.15}
              height={0.01}
            >
              {userData.username || "Unknown User"}
              <meshStandardMaterial color="#fff" />
            </Text3D>
            
            <Text3D
              position={[-0.7, 0.3, 0.02]}
              font="/fonts/helvetiker_regular.typeface.json"
              size={0.08}
              height={0.005}
            >
              Bio:
              <meshStandardMaterial color="#ddd" />
            </Text3D>
            <Text3D
              position={[-0.7, 0.15, 0.02]}
              font="/fonts/helvetiker_regular.typeface.json"
              size={0.06}
              height={0.005}
              maxWidth={1.5}
            >
              {displayLine1}
              <meshStandardMaterial color="#ddd" />
            </Text3D>
            <Text3D
              position={[-0.7, 0.03, 0.02]}
              font="/fonts/helvetiker_regular.typeface.json"
              size={0.06}
              height={0.005}
              maxWidth={1.4}
            >
              {displayLine2 + (showEllipsis ? "..." : "")}
              <meshStandardMaterial color="#ddd" />
            </Text3D>
            {/* Profile Image */}
            {profileTexture && (
              <mesh 
              position={[-0.4, -0.4, 0.02]}
              >
                <planeGeometry args={[0.65, 0.65]} />
                <meshStandardMaterial
                  map={profileTexture}
                  metalness={0.1}
                  roughness={0.2}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
            {/* Total Posts */}
            <Text3D
              position={[-0.7, -0.9, 0.02]}
              font="/fonts/helvetiker_regular.typeface.json"
              size={0.05}
              height={0.005}
            >
              Posts: {userData.totalPosts || "0"}
              <meshStandardMaterial color="#ddd" />
            </Text3D>
            {logoTexture && (
              <mesh position={[0.45, -0.7, 0.02]}>
                <planeGeometry args={[0.3, 0.3]} />
                <meshStandardMaterial
                  map={logoTexture}
                  metalness={0.1}
                  envMapIntensity={2.5}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
            <Text3D
              position={[0.32, -0.96, 0.02]}
              font="/fonts/helvetiker_regular.typeface.json"
              size={0.055}
              height={0.007}
            >
              BeRony
              <meshStandardMaterial color="#ddd" />
            </Text3D>
          </RoundedBox>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          transparent
          opacity={1}
          color="#c6caf9"
          depthTest={false}
          resolution={[width, height]}
          lineWidth={0.5}
        />
      </mesh>
    </>
  );
}

export default function BeronyUserIDCard() {
  const { userId } = useParams();
  const location = useLocation();
  const [userData, setUserData] = useState({
    username: "Loading...",
    userBio: "",
    userId: "",
    userEmotion: "😊",
    imageurl: "",
    totalPosts: "0",
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const username = searchParams.get("username") || "Loading...";
    const userBio = searchParams.get("userBio") || "";
    const userEmotion = searchParams.get("userEmotion") || "😊";
    const imageurl = searchParams.get("imageurl") || "";
    const totalPosts = searchParams.get("totalPosts") || "0";

    // If query params exist, use them; otherwise, fetch from API
    if (searchParams.toString()) {
      setUserData({
        username,
        userBio,
        userId,
        userEmotion,
        imageurl,
        totalPosts,
      });
    } else {
      axios
        .get(`https://berony-server.onrender.com/api/user/${userId}`)
        .then((response) => {
          const { username, userBio, userId, userEmotion } = response.data.user;
          setUserData({
            username,
            userBio,
            userId,
            userEmotion,
            imageurl: "", 
            totalPosts: "0", 
          });
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setUserData({
            username: "User Not Found",
            userBio: "Error",
            userId: "",
            userEmotion: "😞",
            imageurl: "",
            totalPosts: "0",
          });
        });
    }
  }, [userId, location.search]);

  return (
    <div style={{ position: "relative", height: "100vh", background: "#000" }}>
      <Canvas camera={{ position: [0, 0, 13], fov: 25 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.8} color="#fff" />
        <Physics gravity={[0, -40, 0]} timeStep={1 / 60}>
          <BeronyIDCard userData={userData} />
        </Physics>
      </Canvas>
    </div>
  );
}