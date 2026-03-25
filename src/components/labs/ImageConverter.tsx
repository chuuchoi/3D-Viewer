import { useRef, useState, type ChangeEvent } from 'react';

interface ImageConverterProps {
  style?: React.CSSProperties;
}

const ImageConverter = ({ style }: ImageConverterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl);

    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Grayscale using Luminosity Method (Rec. 709 weights)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);
    };
  };

  return (
    <div style={{...containerStyle, ...style}}>
      <div style={uploadContainerStyle}>
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          onChange={handleFileChange}
          style={inputStyle}
        />
        <label htmlFor="fileInput" style={labelStyle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span>이미지 파일 선택</span>
        </label>
      </div>

      <div style={imgContainerStyle}>
        <div>
          <h2 style={titleStyle}>원본사진</h2>
          <div style={imageWrapperStyle}>
            {originalImage ? (
              <img src={originalImage} alt="Original" style={imageStyle} />
            ) : (
              <div style={placeholderStyle}>이미지를 선택하세요</div>
            )}
          </div>
        </div>

        <div>
          <h2 style={titleStyle}>흑백사진</h2>
          <canvas ref={canvasRef} style={canvasStyle} />
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
  minHeight: '100vh',
  background: '#222',
  padding: '20px',
};

const uploadContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
};

const inputStyle: React.CSSProperties = {
  display: 'none',
};

const labelStyle: React.CSSProperties = {
  width: 'fit-content',
  backgroundColor: 'aliceblue',
  padding: '10px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  color: '#333',
  fontWeight: 500,
};

const imgContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '40px',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  color: '#eeec',
  fontWeight: 600,
  marginBottom: '10px',
  textAlign: 'center',
};

const imageWrapperStyle: React.CSSProperties = {
  width: '33vh',
  height: '33vh',
  backgroundColor: '#111',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const placeholderStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '14px',
};

const canvasStyle: React.CSSProperties = {
  width: '33vh',
  height: '33vh',
  objectFit: 'contain',
  backgroundColor: '#111',
};

export default ImageConverter;
