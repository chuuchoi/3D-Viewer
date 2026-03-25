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
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    // 1. 막대 개수 및 간격 설정
    float numBars = 12.0;
    float barSpacing = 0.15; 
    
    // x 좌표를 기준으로 인덱스 계산
    float xPos = (uv.x + 1.0) * 0.5 * numBars; 
    int idx = int(floor(xPos));
    
    // 0~63 범위 내로 오디오 인덱스 제한
    float audioVal = u_audio[idx % 64] / 255.0;
    
    // 2. 막대별 로컬 좌표계 생성 (중앙 기준)
    vec2 barUV = vec2(fract(xPos) - 0.5, uv.y);
    
    // 3. 막대 크기 설정
    float width = 0.2;            // 막대 두께
    float height = audioVal * 0.8; // 오디오 값에 따른 가변 높이
    float radius = 0.1;           // 둥근 정도 (끝부분을 완전히 둥글게)
    
    // 4. 둥근 막대 그리기
    // sdRoundedRect(지점, 반반지름(half-extents), 반지름)
    float d = sdRoundedRect(barUV, vec2(width, height), radius);
    
    // 외곽선 부드럽게 처리 (Antialiasing)
    float mask = smoothstep(0.01, 0.0, d);
    
    // 5. 색상 적용 (이미지의 선명한 파란색)
    vec3 color = vec3(1.0, 0.0, 1.0);
    
    // 최종 출력
    outColor = vec4(color * mask, 1.0);
}