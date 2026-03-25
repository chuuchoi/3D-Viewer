#version 300 es
precision mediump float;

out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_audio[64];

// 둥근 직사각형을 그리기 위한 SDF 함수
float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

void main() {
    // 좌표 정규화 (-1.0 ~ 1.0)
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution;
    
    float numBars = 12.0;
    float spacing = 0.2; // 막대 사이의 간격 조절
    
    // x 좌표를 0.0 ~ 1.0 범위로 정규화한 뒤 인덱스 계산
    // uv.x가 -aspect ~ aspect 범위이므로 적절히 매핑
    float xScaled = (uv.x * 0.8 + 0.5) * numBars; 
    int idx = int(floor(xScaled));
    
    // 인덱스 범위 제한 (배열 오버플로우 방지)
    idx = clamp(idx, 0, 31);
    
    // 오디오 값 가져오기 (255.0으로 나누어 0~1 정규화)
    float audioVal = u_audio[idx] / 255.0;
    
    // 3. 각 막대의 로컬 좌표 생성
    // fract를 사용해 각 칸 안에서 -0.5 ~ 0.5 범위를 가짐
    vec2 barUV = vec2(fract(xScaled) - 0.5, uv.y);
    
    float width = 0.2;           // 막대 두께
    vec2 halfSize = vec2(width, audioVal * 0.7); // 너비와 높이의 절반값
    float radius = 0.1; 
    
    // 5. SDF 그리기 및 마스크 생성
    float d = sdRoundedRect(barUV, halfSize, radius);
    float mask = smoothstep(0.01, 0.0, d);
    
    // 배경색과 막대색 혼합 (배경은 검은색, 막대는 핑크/마젠타)
    vec3 color = vec3(1.0, 0.0, 1.0) * mask;
    
    outColor = vec4(color, 1.0);
}