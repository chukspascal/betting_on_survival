import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, Float, ContactShadows, Environment, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { SITE_CONFIG } from '../config'

/**
 * Generates a realistic ribbed paper-edge texture on an HTML5 canvas
 */
function createPageEdgeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f3efe6'
  ctx.fillRect(0, 0, 512, 512)

  for (let i = 0; i < 512; i += 2) {
    const shade = 226 + Math.floor(Math.random() * 18)
    ctx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 10})`
    ctx.fillRect(i, 0, 1, 512)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Renders the LEFT page of an open book spread for a given chapter
 */
function createLeftPageTexture(chapter) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1448
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 1024, 0)
  grad.addColorStop(0, '#eae3d5')
  grad.addColorStop(0.06, '#fcfaf5')
  grad.addColorStop(0.88, '#f8f4ec')
  grad.addColorStop(0.96, '#dfd7c8')
  grad.addColorStop(1, '#bfb6a6')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 1448)

  ctx.fillStyle = '#71717a'
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('BETTING ON SURVIVAL', 110, 115)

  ctx.fillStyle = '#ea580c'
  ctx.font = 'bold 24px monospace'
  ctx.fillText(chapter.chapterLabel, 110, 240)

  ctx.fillStyle = '#111215'
  ctx.font = '900 46px sans-serif'
  const words = chapter.title.split(' ')
  let line = ''
  let y = 310
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    if (ctx.measureText(testLine).width > 780 && i > 0) {
      ctx.fillText(line.trim(), 110, y)
      line = words[i] + ' '
      y += 56
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), 110, y)

  y += 38
  ctx.fillStyle = '#f97316'
  ctx.fillRect(110, y, 85, 6)

  y += 55
  ctx.fillStyle = '#3f3f46'
  ctx.font = 'italic 25px serif'
  const quoteWords = chapter.quote.split(' ')
  let qLine = ''
  for (let i = 0; i < quoteWords.length; i++) {
    const testLine = qLine + quoteWords[i] + ' '
    if (ctx.measureText(testLine).width > 760 && i > 0) {
      ctx.fillText(qLine.trim(), 110, y)
      qLine = quoteWords[i] + ' '
      y += 38
    } else {
      qLine = testLine
    }
  }
  ctx.fillText(qLine.trim(), 110, y)

  y += 70
  ctx.fillStyle = '#18181b'
  ctx.font = '26px serif'
  chapter.leftLines.forEach((l, idx) => {
    ctx.fillText(l, 110, y + idx * 45)
  })

  ctx.fillStyle = '#71717a'
  ctx.font = 'bold 22px monospace'
  ctx.fillText(chapter.leftPageNumber, 110, 1345)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/**
 * Renders the RIGHT page of an open book spread for a given chapter
 */
function createRightPageTexture(chapter) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1448
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 1024, 0)
  grad.addColorStop(0, '#bfb6a6')
  grad.addColorStop(0.04, '#dfd7c8')
  grad.addColorStop(0.12, '#f8f4ec')
  grad.addColorStop(0.94, '#fcfaf5')
  grad.addColorStop(1, '#eae3d5')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 1448)

  ctx.fillStyle = '#71717a'
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'right'
  ctx.fillText('OGBU AMUCHE SOLOMON (JEFFRETZ)', 914, 115)

  ctx.strokeStyle = '#e4decb'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(115, 145)
  ctx.lineTo(914, 145)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#18181b'
  ctx.font = '27px serif'
  chapter.rightLines.forEach((l, idx) => {
    if (l.startsWith('—')) {
      ctx.font = 'bold italic 26px serif'
      ctx.fillStyle = '#ea580c'
    } else {
      ctx.font = '27px serif'
      ctx.fillStyle = '#18181b'
    }
    ctx.fillText(l, 115, 240 + idx * 48)
  })

  ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(115, 1060, 795, 165)

  ctx.fillStyle = '#ea580c'
  ctx.font = 'bold 19px monospace'
  ctx.fillText('KEY TAKEAWAY • ' + chapter.chapterLabel, 145, 1108)

  ctx.fillStyle = '#27272a'
  ctx.font = 'italic 23px serif'
  ctx.fillText('“Because sometimes, the real victory is not winning', 145, 1152)
  ctx.fillText('a bet; it is refusing to place another one.”', 145, 1188)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#71717a'
  ctx.font = 'bold 22px monospace'
  ctx.fillText(chapter.rightPageNumber, 914, 1345)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function HardcoverBook({
  scrollProgress,
  viewMode,
  activeChapterIndex,
  dragOffset,
  onBookPointerDown,
}) {
  const bookGroup = useRef()
  const frontCoverPivot = useRef()
  const turningSheet1 = useRef()
  const turningSheet2 = useRef()
  const turningSheet3 = useRef()
  const [hovered, setHovered] = useState(false)
  const { viewport, pointer } = useThree()
  const isMobile = viewport.width < 3.6 // Portrait phone / narrow tablet in 3D world units

  useEffect(() => {
    document.body.style.cursor = hovered ? 'grab' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  const [frontTex, backTex, spineTex] = useTexture([
    '/assets/front-cover.jpg',
    '/assets/back-cover.jpg',
    '/assets/spine.jpg',
  ])

  const pageEdgeTex = useMemo(() => createPageEdgeTexture(), [])

  const chapterSpreadTextures = useMemo(() => {
    return SITE_CONFIG.mockChapters.map((ch) => ({
      left: createLeftPageTexture(ch),
      right: createRightPageTexture(ch),
    }))
  }, [])

  useEffect(() => {
    const maxAnisotropy = 16
    ;[frontTex, backTex, spineTex].forEach((tex) => {
      if (!tex) return
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = maxAnisotropy
      tex.needsUpdate = true
    })
  }, [frontTex, backTex, spineTex])

  const bookW = 2.24
  const bookH = 3.18
  const totalThickness = 0.34
  const boardThickness = 0.032
  const pageBlockW = bookW - 0.05
  const pageBlockH = bookH - 0.06
  const pageBlockD = totalThickness - boardThickness * 2

  const currentSpread =
    chapterSpreadTextures[activeChapterIndex] || chapterSpreadTextures[0]

  const darkCoverMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#101216',
        roughness: 0.34,
        metalness: 0.08,
        clearcoat: 0.22,
        clearcoatRoughness: 0.28,
      }),
    []
  )

  const frontMaterials = useMemo(
    () => [
      darkCoverMat,
      darkCoverMat,
      darkCoverMat,
      darkCoverMat,
      new THREE.MeshPhysicalMaterial({
        map: frontTex,
        roughness: 0.26,
        metalness: 0.04,
        clearcoat: 0.28,
        clearcoatRoughness: 0.25,
      }),
      darkCoverMat,
    ],
    [frontTex, darkCoverMat]
  )

  const backMaterials = useMemo(
    () => [
      darkCoverMat,
      darkCoverMat,
      darkCoverMat,
      darkCoverMat,
      darkCoverMat,
      new THREE.MeshPhysicalMaterial({
        map: backTex,
        roughness: 0.28,
        metalness: 0.04,
        clearcoat: 0.25,
        clearcoatRoughness: 0.28,
      }),
    ],
    [backTex, darkCoverMat]
  )

  const spineMaterials = useMemo(
    () => [
      darkCoverMat,
      new THREE.MeshPhysicalMaterial({
        map: spineTex,
        roughness: 0.28,
        metalness: 0.06,
        clearcoat: 0.28,
      }),
      darkCoverMat,
      darkCoverMat,
      darkCoverMat,
      darkCoverMat,
    ],
    [spineTex, darkCoverMat]
  )

  const edgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: pageEdgeTex,
        roughness: 0.8,
        metalness: 0.0,
      }),
    [pageEdgeTex]
  )

  const baseLeftMat = useMemo(
    () => [
      edgeMat,
      darkCoverMat,
      edgeMat,
      edgeMat,
      edgeMat,
      new THREE.MeshStandardMaterial({
        map: viewMode !== 'auto' ? currentSpread.left : chapterSpreadTextures[0].left,
        roughness: 0.72,
      }),
    ],
    [edgeMat, darkCoverMat, viewMode, currentSpread, chapterSpreadTextures]
  )

  const baseRightMat = useMemo(
    () => [
      edgeMat,
      darkCoverMat,
      edgeMat,
      edgeMat,
      new THREE.MeshStandardMaterial({
        map: viewMode !== 'auto' ? currentSpread.right : chapterSpreadTextures[3].right,
        roughness: 0.72,
      }),
      edgeMat,
    ],
    [edgeMat, darkCoverMat, viewMode, currentSpread, chapterSpreadTextures]
  )

  const sheet1Mat = useMemo(
    () => [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      new THREE.MeshStandardMaterial({ map: chapterSpreadTextures[0].right, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ map: chapterSpreadTextures[1].left, roughness: 0.72 }),
    ],
    [edgeMat, chapterSpreadTextures]
  )

  const sheet2Mat = useMemo(
    () => [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      new THREE.MeshStandardMaterial({ map: chapterSpreadTextures[1].right, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ map: chapterSpreadTextures[2].left, roughness: 0.72 }),
    ],
    [edgeMat, chapterSpreadTextures]
  )

  const sheet3Mat = useMemo(
    () => [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      new THREE.MeshStandardMaterial({ map: chapterSpreadTextures[2].right, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ map: chapterSpreadTextures[3].left, roughness: 0.72 }),
    ],
    [edgeMat, chapterSpreadTextures]
  )

  useFrame((state, delta) => {
    if (!bookGroup.current) return
    const p = scrollProgress.current || 0

    // Calculate responsive scales so both closed book AND wide-open 2-page spread fit any phone screen!
    const closedMobileScale = Math.min(0.68, (viewport.width * 0.68) / bookW)
    const openMobileScale = Math.min(0.46, (viewport.width * 0.88) / (bookW * 1.95))

    const rightStageX = isMobile ? 0 : Math.min(1.55, Math.max(1.05, viewport.width * 0.2))
    // On mobile portrait, lift the book into the top half of the screen (y = +0.58) while cards scroll in the bottom half!
    const mobileStageY = 0.56

    let targetX = 0
    let targetY = isMobile ? 0.15 : 0.04
    let targetZ = isMobile ? 0.1 : 0.68
    let targetRotX = 0.04
    let targetRotY = -0.32
    let targetRotZ = 0.01
    let targetOpenAngle = 0
    let targetScale = isMobile ? closedMobileScale : 1.06

    let sheet1Angle = 0
    let sheet2Angle = 0
    let sheet3Angle = 0

    if (viewMode !== 'auto') {
      if (viewMode === 'front') {
        targetX = 0
        targetY = isMobile ? 0.2 : 0.04
        targetZ = isMobile ? 0.15 : 0.75
        targetRotX = 0.02
        targetRotY = -0.15
        targetRotZ = 0
        targetOpenAngle = 0
        targetScale = isMobile ? closedMobileScale : 1.06
      } else if (viewMode === 'open') {
        targetScale = isMobile ? openMobileScale : 1.02
        // Shift right by half the scaled book width so the 2-page open spread is centered on mobile & desktop!
        targetX = isMobile ? bookW * openMobileScale * 0.48 : 1.04
        targetY = isMobile ? 0.28 : 0.04
        targetZ = isMobile ? 0.1 : 0.9
        targetRotX = 0.04
        targetRotY = -0.04
        targetRotZ = 0
        targetOpenAngle = -2.76
        sheet1Angle = activeChapterIndex >= 1 ? -2.73 : 0
        sheet2Angle = activeChapterIndex >= 2 ? -2.725 : 0
        sheet3Angle = activeChapterIndex >= 3 ? -2.72 : 0
      } else if (viewMode === 'spine') {
        targetX = 0
        targetY = isMobile ? 0.2 : 0.04
        targetZ = isMobile ? 0.15 : 0.75
        targetRotX = 0.04
        targetRotY = 1.25
        targetRotZ = -0.02
        targetOpenAngle = 0
      } else if (viewMode === 'back') {
        targetX = 0
        targetY = isMobile ? 0.2 : 0.04
        targetZ = isMobile ? 0.15 : 0.75
        targetRotX = 0.02
        targetRotY = Math.PI - 0.14
        targetRotZ = 0
        targetOpenAngle = 0
      }
    } else {
      // Open spread X position: centered in top stage on mobile, or right stage on desktop
      const openX = isMobile ? bookW * openMobileScale * 0.48 : 1.32

      if (p < 0.1) {
        // Act 1: Front Cover & Spine intro (Centered on screen)
        const t = p / 0.1
        targetX = 0
        targetY = isMobile ? THREE.MathUtils.lerp(0.15, mobileStageY, t) : 0.04
        targetZ = isMobile ? 0.15 : THREE.MathUtils.lerp(0.62, 0.78, t)
        targetRotY = THREE.MathUtils.lerp(-0.42, -0.08, t)
        targetRotX = THREE.MathUtils.lerp(0.06, 0.03, t)
        targetRotZ = THREE.MathUtils.lerp(0.02, 0, t)
        targetOpenAngle = 0
        targetScale = isMobile ? closedMobileScale : 1.06
      } else if (p < 0.2) {
        // Act 2: Book Hinges Wide Open into Chapter 1 Spread!
        const t = (p - 0.1) / 0.1
        targetScale = isMobile
          ? THREE.MathUtils.lerp(closedMobileScale, openMobileScale, t)
          : 1.04
        targetX = THREE.MathUtils.lerp(0, openX, t)
        targetY = isMobile ? mobileStageY : 0.04
        targetZ = isMobile ? 0.1 : THREE.MathUtils.lerp(0.78, 0.82, t)
        targetRotY = THREE.MathUtils.lerp(-0.08, isMobile ? -0.03 : -0.12, t)
        targetRotX = 0.04
        targetOpenAngle = THREE.MathUtils.lerp(0, -2.76, t)
      } else if (p < 0.34) {
        // Act 3: Chapter 1 -> Turn Sheet 1 to Chapter 2
        const t = (p - 0.2) / 0.14
        targetScale = isMobile ? openMobileScale : 1.04
        targetX = openX
        targetY = isMobile ? mobileStageY : 0.04
        targetZ = isMobile ? 0.1 : 0.82
        targetRotY = isMobile ? -0.03 : -0.12
        targetRotX = 0.04
        targetOpenAngle = -2.76
        const turnT = Math.max(0, Math.min(1, (t - 0.35) / 0.65))
        sheet1Angle = THREE.MathUtils.smoothstep(turnT, 0, 1) * -2.73
      } else if (p < 0.48) {
        // Act 4: Chapter 2 -> Turn Sheet 2 to Chapter 3
        const t = (p - 0.34) / 0.14
        targetScale = isMobile ? openMobileScale : 1.04
        targetX = openX
        targetY = isMobile ? mobileStageY : 0.04
        targetZ = isMobile ? 0.1 : 0.82
        targetRotY = isMobile ? -0.03 : -0.12
        targetRotX = 0.04
        targetOpenAngle = -2.76
        sheet1Angle = -2.73
        const turnT = Math.max(0, Math.min(1, (t - 0.35) / 0.65))
        sheet2Angle = THREE.MathUtils.smoothstep(turnT, 0, 1) * -2.725
      } else if (p < 0.62) {
        // Act 5: Chapter 3 -> Turn Sheet 3 to Chapter 4
        const t = (p - 0.48) / 0.14
        targetScale = isMobile ? openMobileScale : 1.04
        targetX = openX
        targetY = isMobile ? mobileStageY : 0.04
        targetZ = isMobile ? 0.1 : 0.82
        targetRotY = isMobile ? -0.03 : -0.12
        targetRotX = 0.04
        targetOpenAngle = -2.76
        sheet1Angle = -2.73
        sheet2Angle = -2.725
        const turnT = Math.max(0, Math.min(1, (t - 0.3) / 0.55))
        sheet3Angle = THREE.MathUtils.smoothstep(turnT, 0, 1) * -2.72
      } else if (p < 0.74) {
        // Act 6: Close the book & Flip 180° to reveal the Back Cover!
        const t = (p - 0.62) / 0.12
        targetScale = isMobile
          ? THREE.MathUtils.lerp(openMobileScale, closedMobileScale * 0.92, t)
          : 1.06
        targetX = THREE.MathUtils.lerp(openX, rightStageX, t)
        targetY = isMobile ? mobileStageY : 0.04
        targetZ = isMobile ? 0.1 : THREE.MathUtils.lerp(0.82, 0.72, t)
        targetRotY = THREE.MathUtils.lerp(isMobile ? -0.03 : -0.12, Math.PI - 0.22, t)
        targetRotX = 0.03
        const closeT = Math.min(1, t * 1.4)
        targetOpenAngle = THREE.MathUtils.lerp(-2.76, 0, closeT)
        sheet1Angle = THREE.MathUtils.lerp(-2.73, 0, closeT)
        sheet2Angle = THREE.MathUtils.lerp(-2.725, 0, closeT)
        sheet3Angle = THREE.MathUtils.lerp(-2.72, 0, closeT)
      } else if (p < 0.88) {
        // Act 7: Back Cover Showcase while Author section scrolls
        const t = (p - 0.74) / 0.14
        targetScale = isMobile ? closedMobileScale * 0.92 : 1.06
        targetX = rightStageX
        targetY = isMobile ? mobileStageY : 0.04
        targetZ = isMobile ? 0.1 : 0.72
        targetRotY = THREE.MathUtils.lerp(Math.PI - 0.22, Math.PI + 0.18, t)
        targetRotX = 0.04
        targetOpenAngle = 0
      } else {
        // Act 8 (0.88 -> 1.00 — Very End of Page): Spin to Final Collector's Showcase Pose!
        const t = (p - 0.88) / 0.12
        targetScale = isMobile ? closedMobileScale * 0.88 : 1.06
        targetX = rightStageX * 1.05
        targetY = isMobile ? mobileStageY + 0.08 : 0.05
        targetZ = isMobile ? 0.05 : THREE.MathUtils.lerp(0.72, 0.58, t)
        targetRotY = THREE.MathUtils.lerp(Math.PI + 0.18, Math.PI * 2 - 0.38, t)
        targetRotX = THREE.MathUtils.lerp(0.04, 0.08, t)
        targetRotZ = THREE.MathUtils.lerp(0.0, 0.02, t)
        targetOpenAngle = 0
      }
    }

    const mouseTiltX = -pointer.y * 0.06 + dragOffset.current.y
    const mouseTiltY = pointer.x * 0.1 + dragOffset.current.x

    const smooth = Math.min(1, delta * 5.5)
    bookGroup.current.scale.setScalar(
      THREE.MathUtils.lerp(bookGroup.current.scale.x, targetScale, smooth)
    )

    bookGroup.current.position.x = THREE.MathUtils.lerp(bookGroup.current.position.x, targetX, smooth)
    bookGroup.current.position.y = THREE.MathUtils.lerp(bookGroup.current.position.y, targetY, smooth)
    bookGroup.current.position.z = THREE.MathUtils.lerp(bookGroup.current.position.z, targetZ, smooth)

    bookGroup.current.rotation.x = THREE.MathUtils.lerp(
      bookGroup.current.rotation.x,
      targetRotX + mouseTiltX,
      smooth
    )
    bookGroup.current.rotation.y = THREE.MathUtils.lerp(
      bookGroup.current.rotation.y,
      targetRotY + mouseTiltY,
      smooth
    )
    bookGroup.current.rotation.z = THREE.MathUtils.lerp(bookGroup.current.rotation.z, targetRotZ, smooth)

    if (frontCoverPivot.current) {
      frontCoverPivot.current.rotation.y = THREE.MathUtils.lerp(
        frontCoverPivot.current.rotation.y,
        targetOpenAngle,
        smooth * 1.25
      )
    }

    if (turningSheet1.current) {
      turningSheet1.current.rotation.y = THREE.MathUtils.lerp(
        turningSheet1.current.rotation.y,
        sheet1Angle,
        smooth * 1.35
      )
    }
    if (turningSheet2.current) {
      turningSheet2.current.rotation.y = THREE.MathUtils.lerp(
        turningSheet2.current.rotation.y,
        sheet2Angle,
        smooth * 1.35
      )
    }
    if (turningSheet3.current) {
      turningSheet3.current.rotation.y = THREE.MathUtils.lerp(
        turningSheet3.current.rotation.y,
        sheet3Angle,
        smooth * 1.35
      )
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.12}>
      <group
        ref={bookGroup}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onPointerDown={(e) => {
          e.stopPropagation()
          onBookPointerDown(e)
        }}
      >
        {/* HINGED FRONT COVER + BASE LEFT PAGE STACK */}
        <group
          ref={frontCoverPivot}
          position={[-bookW / 2 + 0.015, 0, totalThickness / 2 - boardThickness / 2]}
        >
          <mesh
            position={[bookW / 2, 0, 0]}
            material={frontMaterials}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[bookW, bookH, boardThickness]} />
          </mesh>

          <mesh
            position={[bookW / 2 + 0.01, 0, -boardThickness / 2 - 0.02]}
            material={baseLeftMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[pageBlockW, pageBlockH, 0.038]} />
          </mesh>

          <mesh position={[0.075, 0, boardThickness / 2 + 0.001]}>
            <boxGeometry args={[0.012, bookH - 0.01, 0.004]} />
            <meshStandardMaterial color="#050608" roughness={0.7} />
          </mesh>
        </group>

        {/* PHYSICAL TURNING SHEET 1 */}
        <group
          ref={turningSheet1}
          position={[-bookW / 2 + 0.025, 0, totalThickness / 2 - boardThickness - 0.042]}
        >
          <mesh position={[pageBlockW / 2, 0, 0]} material={sheet1Mat} castShadow receiveShadow>
            <boxGeometry args={[pageBlockW, pageBlockH, 0.005]} />
          </mesh>
        </group>

        {/* PHYSICAL TURNING SHEET 2 */}
        <group
          ref={turningSheet2}
          position={[-bookW / 2 + 0.025, 0, totalThickness / 2 - boardThickness - 0.05]}
        >
          <mesh position={[pageBlockW / 2, 0, 0]} material={sheet2Mat} castShadow receiveShadow>
            <boxGeometry args={[pageBlockW, pageBlockH, 0.005]} />
          </mesh>
        </group>

        {/* PHYSICAL TURNING SHEET 3 */}
        <group
          ref={turningSheet3}
          position={[-bookW / 2 + 0.025, 0, totalThickness / 2 - boardThickness - 0.058]}
        >
          <mesh position={[pageBlockW / 2, 0, 0]} material={sheet3Mat} castShadow receiveShadow>
            <boxGeometry args={[pageBlockW, pageBlockH, 0.005]} />
          </mesh>
        </group>

        {/* BACK HARDCOVER BOARD */}
        <mesh
          position={[0.015, 0, -totalThickness / 2 + boardThickness / 2]}
          material={backMaterials}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[bookW, bookH, boardThickness]} />
        </mesh>

        {/* SPINE BOARD + ROUNDED EDGE JOINTS */}
        <mesh
          position={[-bookW / 2 + 0.008, 0, 0]}
          material={spineMaterials}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.044, bookH, totalThickness]} />
        </mesh>
        <mesh
          position={[-bookW / 2 + 0.008, 0, totalThickness / 2 - 0.012]}
          material={darkCoverMat}
        >
          <cylinderGeometry args={[0.016, 0.016, bookH, 16]} />
        </mesh>
        <mesh
          position={[-bookW / 2 + 0.008, 0, -totalThickness / 2 + 0.012]}
          material={darkCoverMat}
        >
          <cylinderGeometry args={[0.016, 0.016, bookH, 16]} />
        </mesh>

        {/* BASE RIGHT PAGE BLOCK */}
        <mesh
          position={[0.025, 0, -0.028]}
          material={baseRightMat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[pageBlockW, pageBlockH, pageBlockD - 0.055]} />
        </mesh>
      </group>
    </Float>
  )
}

export default function Scene3D({ scrollProgress, viewMode, activeChapterIndex }) {
  const dragOffset = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const prevPointer = useRef({ x: 0, y: 0 })
  const { progress, active } = useProgress()

  const handleBookPointerDown = (e) => {
    // Only capture horizontal rotation drag for mouse or deliberate drag; let vertical touch scroll naturally
    isDragging.current = true
    prevPointer.current = { x: e.clientX, y: e.clientY }
    document.body.style.cursor = 'grabbing'
  }

  useEffect(() => {
    const handleWindowPointerMove = (e) => {
      if (!isDragging.current) return
      const dx = (e.clientX - prevPointer.current.x) * 0.0075
      const dy = (e.clientY - prevPointer.current.y) * 0.0055
      dragOffset.current.x += dx
      dragOffset.current.y = Math.max(-0.5, Math.min(0.5, dragOffset.current.y + dy))
      prevPointer.current = { x: e.clientX, y: e.clientY }
    }

    const handleWindowPointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = 'auto'
      }
    }

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true })
    window.addEventListener('pointerup', handleWindowPointerUp)
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
    }
  }, [])

  useEffect(() => {
    dragOffset.current = { x: 0, y: 0 }
  }, [viewMode])

  return (
    <div className="fixed inset-0 z-0 studio-backdrop pointer-events-none">
      {active && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-black/5 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${Math.max(15, progress)}%` }}
          />
        </div>
      )}

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5.2], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'auto', touchAction: 'pan-y' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 7, 6]} intensity={2.1} color="#ffffff" castShadow />
        <directionalLight position={[-5, 3, 4]} intensity={1.15} color="#fff7ed" />
        <directionalLight position={[2, -3, 3]} intensity={0.6} color="#ffedd5" />

        <React.Suspense fallback={null}>
          <HardcoverBook
            scrollProgress={scrollProgress}
            viewMode={viewMode}
            activeChapterIndex={activeChapterIndex}
            dragOffset={dragOffset}
            onBookPointerDown={handleBookPointerDown}
          />
          <Environment preset="studio" />
          <ContactShadows
            position={[0, -2.08, 0.2]}
            opacity={0.36}
            scale={11}
            blur={2.4}
            far={4.5}
            color="#18181b"
          />
        </React.Suspense>
      </Canvas>
    </div>
  )
}
