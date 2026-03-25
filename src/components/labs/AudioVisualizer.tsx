import { useEffect, useRef, useState } from 'react';
import vertexShaderSource from './shaders/vertex.glsl?raw';
import fragmentShaderSource from './shaders/fragment1.glsl?raw';

interface AudioVisualizerProps {
  style?: React.CSSProperties;
}

const AudioVisualizer = ({ style }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const audioCtxRef = useRef<AudioContext>(null);
  const streamRef = useRef<MediaStream>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- WebGL 초기화 함수 ---
  const initWebGL = (gl: WebGL2RenderingContext) => {
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    return {
      program,
      uResLoc: gl.getUniformLocation(program, 'u_resolution'),
      uAudioLoc: gl.getUniformLocation(program, 'u_audio'),
    };
  };

  // --- 오디오 중단 함수 ---
  const stopAudio = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // 캔버스 초기화 (검은색으로 비우기)
    const gl = canvasRef.current?.getContext('webgl2');
    if (gl) {
      gl.clearColor(0, 0, 0, 0); // 투명 혹은 배경색
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    setIsPlaying(false);
  };

  // --- 오디오 시작 함수 ---
  const startAudio = async () => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2');
    if (!canvas || !gl) return;

    const { program, uResLoc, uAudioLoc } = initWebGL(gl);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioCtxRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; 
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);
        gl.uniform2f(uResLoc, canvas.width, canvas.height);
        gl.uniform1fv(uAudioLoc, new Float32Array(Array.from(dataArray)));
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animationRef.current = requestAnimationFrame(draw);
      };
      
      draw();
      setIsPlaying(true);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  };

  useEffect(() => {
    return () => stopAudio(); // 컴포넌트 언마운트 시 정리
  }, []);

  return (
    <div style={{...containerStyle, ...style}}>
      <canvas ref={canvasRef} width={800} height={400} style={canvasStyle} />
      
      <button 
        onClick={isPlaying ? stopAudio : startAudio}
        style={{ position:'relative', display: 'flex', alignItems:'center', justifyContent: 'center', gap: '4px', backgroundColor: isPlaying ? '' : '#444'}}
      >
        <svg width="100%" height="100%" viewBox="0 0 16 4" fill="none" xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{position:'absolute', top: '0px', right: '0px', width: '100%', height: '100%'}}
        >
          <path
            style={{transition:'all 0.8s ease-in-out, fill 0.8s ease-in-out 0.5s',
              strokeDasharray: '123',
              strokeDashoffset: isPlaying? '0': '123',
              stroke: isPlaying? '#f0fa': 'currentColor',
            }}
            d="M0 0 H16 V4 H0 V0 Z" 
            stroke="currentColor"
            strokeWidth={0.2}
          />
        </svg>

        <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            style={{transition:'all 0.8s ease-in-out, fill 0.8s ease-in-out 0.5s',
              strokeDasharray: '123',
              strokeDashoffset: isPlaying? '0': '123',
              fill: isPlaying? '#fff2': 'currentColor',
              stroke: isPlaying? '#f0fa': 'currentColor',
            }}
            d="M8 9.75C9.46719 9.75 10.6562 8.575 10.6562 7.125V3.625C10.6562 2.175 9.46719 1 8 1C6.53281 1 5.34375 2.175 5.34375 3.625V7.125C5.34375 8.575 6.53281 9.75 8 9.75ZM13.1562 7.09375C13.1562 7.025 13.1 6.96875 13.0312 6.96875H12.0938C12.025 6.96875 11.9688 7.025 11.9688 7.09375C11.9688 9.28594 10.1922 11.0625 8 11.0625C5.80781 11.0625 4.03125 9.28594 4.03125 7.09375C4.03125 7.025 3.975 6.96875 3.90625 6.96875H2.96875C2.9 6.96875 2.84375 7.025 2.84375 7.09375C2.84375 9.72969 4.82188 11.9047 7.375 12.2125V13.8125H5.10469C4.89063 13.8125 4.71875 14.0359 4.71875 14.3125V14.875C4.71875 14.9438 4.7625 15 4.81563 15H11.1844C11.2375 15 11.2812 14.9438 11.2812 14.875V14.3125C11.2812 14.0359 11.1094 13.8125 10.8953 13.8125H8.5625V12.2203C11.1453 11.9391 13.1562 9.75156 13.1562 7.09375Z"
            // fill="transparent"
            // strokeDasharray={100}
            // strokeDashoffset={10}
            // stroke='currentColor'
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </svg>
        <span>{isPlaying ? 'STOP AUDIO' : 'START AUDIO'}</span>
      </button>
    </div>
  );
};

// 스타일 생략 (이전과 동일)
const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', background: '#222', minHeight: '100vh' };
const canvasStyle: React.CSSProperties = { width: '400px', height: '200px', background: '#000', marginBottom: '10px' };

export default AudioVisualizer;