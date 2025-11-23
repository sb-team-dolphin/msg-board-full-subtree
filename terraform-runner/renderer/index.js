// ============================================
// State Management
// ============================================
const state = {
  zipPath: null,
  extractPath: null,
  tfFiles: [],
  tfVariables: [],
  tfVariableValues: {},
  credentials: {
    accessKey: '',
    secretKey: '',
    region: 'ap-northeast-2',
  },
  logs: [],
  startTime: null,
  endTime: null,
  planResult: null,
  applyResult: null,
  destroyResult: null,
  awsCliInstalled: false,
};

// ============================================
// Screen Management
// ============================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// ============================================
// Setup Screen
// ============================================

// ZIP 파일 선택
document.getElementById('select-zip-btn').addEventListener('click', async () => {
  const result = await window.api.selectZipFile();

  if (result.success && result.path) {
    state.zipPath = result.path;
    document.getElementById('zip-path-display').textContent = `선택된 파일: ${result.path}`;

    // ZIP 압축 해제
    addLog('info', 'ZIP 파일 압축 해제 중...');
    const extractResult = await window.api.extractZip(result.path);

    if (extractResult.success) {
      state.extractPath = extractResult.extractPath;
      state.tfFiles = extractResult.tfFiles;

      const infoText = `✓ ${extractResult.fileCount}개의 .tf 파일 발견`;
      document.getElementById('zip-file-info').style.display = 'block';
      document.getElementById('zip-file-info-text').textContent = infoText;

      addLog('success', `ZIP 압축 해제 완료: ${extractResult.fileCount}개 파일 발견`);

      // Terraform 변수 파싱
      await parseTerraformVariables();

      checkNextButtonState();
    } else {
      showError(`ZIP 압축 해제 실패: ${extractResult.error}`);
    }
  }
});

// 다음 버튼 (ZIP 선택 후)
document.getElementById('next-to-variables-btn').addEventListener('click', () => {
  showScreen('variables-screen');
});

// 다음 버튼 활성화 체크
function checkNextButtonState() {
  const hasZip = state.zipPath !== null;
  document.getElementById('next-to-variables-btn').disabled = !hasZip;
}

// ============================================
// Variables Screen
// ============================================

// Terraform 변수 파싱
async function parseTerraformVariables() {
  try {
    const result = await window.api.parseTfVariables(state.extractPath);

    if (result.success) {
      state.tfVariables = result.variables;

      // 변수가 있으면 UI 생성
      if (result.variables.length > 0) {
        renderVariablesForm(result.variables);
      } else {
        // 변수가 없으면 간단한 메시지
        document.getElementById('variables-form').innerHTML =
          '<p class="status-text">이 프로젝트에는 설정 가능한 변수가 없습니다.</p>';
      }
    }
  } catch (error) {
    console.error('Failed to parse variables:', error);
  }
}

// 변수 입력 폼 렌더링
function renderVariablesForm(variables) {
  const form = document.getElementById('variables-form');
  form.innerHTML = '';

  variables.forEach((variable) => {
    const varGroup = document.createElement('div');
    varGroup.className = 'variable-group';

    const label = document.createElement('div');
    label.className = 'variable-label';
    label.textContent = variable.name;

    const description = document.createElement('div');
    description.className = 'variable-description';
    description.textContent = variable.description;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'variable-input';
    input.value = variable.defaultValue;
    input.placeholder = variable.defaultValue || variable.name;
    input.dataset.varName = variable.name;

    // 입력 변경 시 state 업데이트
    input.addEventListener('input', (e) => {
      state.tfVariableValues[variable.name] = e.target.value;
      checkStartButtonState();
    });

    // 초기값 설정
    state.tfVariableValues[variable.name] = variable.defaultValue;

    varGroup.appendChild(label);
    varGroup.appendChild(description);
    varGroup.appendChild(input);

    form.appendChild(varGroup);
  });
}

// 이전 버튼 (변수 화면 → 초기 화면)
document.getElementById('back-to-setup-btn').addEventListener('click', () => {
  showScreen('setup-screen');
});

// 변수 설정 드롭다운 토글
document.getElementById('toggle-variables-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleVariablesSection();
});

document.getElementById('variables-header').addEventListener('click', (e) => {
  // 버튼 클릭은 제외
  if (e.target.closest('.btn') || e.target.closest('.btn-icon')) {
    return;
  }
  toggleVariablesSection();
});

function toggleVariablesSection() {
  const content = document.getElementById('variables-content');
  const toggleBtn = document.getElementById('toggle-variables-btn');

  if (content.style.display === 'none') {
    content.style.display = 'block';
    toggleBtn.textContent = '▲';
    toggleBtn.classList.add('rotated');
  } else {
    content.style.display = 'none';
    toggleBtn.textContent = '▼';
    toggleBtn.classList.remove('rotated');
  }
}

// 기본값으로 리셋 버튼
document.getElementById('reset-defaults-btn').addEventListener('click', (e) => {
  e.stopPropagation(); // 헤더 클릭 이벤트 방지

  // 변수를 기본값으로 리셋
  if (state.tfVariables && state.tfVariables.length > 0) {
    // 저장된 기본값으로 state 리셋
    state.tfVariableValues = {};
    state.tfVariables.forEach(variable => {
      if (variable.defaultValue !== undefined && variable.defaultValue !== null && variable.defaultValue !== '') {
        state.tfVariableValues[variable.name] = variable.defaultValue;
      }
    });

    // 폼 다시 렌더링
    renderVariablesForm(state.tfVariables);

    addLog('info', '🔄 변수가 기본값으로 리셋되었습니다');
  } else {
    addLog('warning', '⚠️ 리셋할 변수가 없습니다');
  }
});

// AWS Credentials 입력 감지
document.getElementById('access-key').addEventListener('input', (e) => {
  state.credentials.accessKey = e.target.value;
  checkStartButtonState();
});

document.getElementById('secret-key').addEventListener('input', (e) => {
  state.credentials.secretKey = e.target.value;
  checkStartButtonState();
});

document.getElementById('region').addEventListener('change', (e) => {
  state.credentials.region = e.target.value;
});

// 시작하기 버튼
document.getElementById('start-btn').addEventListener('click', async () => {
  // terraform.tfvars 생성
  const generateResult = await window.api.generateTfvars(
    state.extractPath,
    state.tfVariableValues
  );

  if (!generateResult.success) {
    showError(`변수 파일 생성 실패: ${generateResult.error}`);
    return;
  }

  addLog('info', 'terraform.tfvars 생성 완료');

  // AWS 설정 후 실행
  await startTerraformExecution();
});

// 리소스 삭제 버튼 (변수 화면에서)
document.getElementById('start-destroy-btn').addEventListener('click', async () => {
  // 확인 모달 표시
  document.getElementById('destroy-resource-count').textContent = '전체';
  document.getElementById('destroy-modal').classList.add('active');
});

// Terraform 실행 시작
async function startTerraformExecution() {
  // AWS 설정
  addLog('info', 'AWS 자격증명 설정 중...');
  const awsResult = await window.api.configureAWS(state.credentials);

  if (!awsResult.success) {
    showError(`AWS 설정 실패: ${awsResult.error}`);
    return;
  }

  addLog('success', 'AWS 설정 완료');

  // 실행 화면으로 전환
  showScreen('execution-screen');
  state.startTime = Date.now();

  // Terraform 실행 시작
  await runTerraformWorkflow();
}

// 시작 버튼 활성화 체크 (variables 화면용)
function checkStartButtonState() {
  const hasCredentials = state.credentials.accessKey && state.credentials.secretKey;
  document.getElementById('start-btn').disabled = !hasCredentials;
  document.getElementById('start-destroy-btn').disabled = !hasCredentials;
}

// 앱 상태 확인
async function checkAppStatus() {
  const statusElement = document.getElementById('app-status');
  let statusHTML = '<p class="status-text">ℹ️ 앱 상태:</p>';

  // Terraform 확인
  const tfCheck = await window.api.checkTerraform();
  if (tfCheck.available) {
    statusHTML += `<p class="status-text status-success">✓ Terraform (${tfCheck.version}) - 내장됨</p>`;
  } else {
    statusHTML += `<p class="status-text status-error">✖ Terraform - 설치 필요 (bin/terraform.exe 추가)</p>`;
  }

  // AWS CLI 확인 (상세)
  const awsCheck = await window.api.checkAWSCliDetailed();
  if (awsCheck.installed) {
    statusHTML += `<p class="status-text status-success">✓ AWS CLI (${awsCheck.version}) - 설치됨</p>`;
    state.awsCliInstalled = true;
  } else {
    statusHTML += `<p class="status-text status-error">✖ AWS CLI - 설치 필요 <button class="btn btn-small" onclick="showAWSCliInstallModal()">설치하기</button></p>`;
    state.awsCliInstalled = false;

    // 자동으로 설치 모달 표시 (첫 실행 시)
    setTimeout(() => {
      if (!state.awsCliInstalled) {
        showAWSCliInstallModal();
      }
    }, 1000);
  }

  statusElement.innerHTML = statusHTML;
}

// ============================================
// Execution Screen
// ============================================

// Terraform 워크플로우 실행
async function runTerraformWorkflow() {
  try {
    // Init
    updateStepStatus('init', 'active');
    updateProgress(10);

    const initResult = await window.api.runTerraform('init', state.extractPath);

    if (!initResult.success) {
      updateStepStatus('init', 'error');
      throw new Error('Terraform init failed');
    }

    updateStepStatus('init', 'completed');
    updateProgress(33);

    // Plan
    updateStepStatus('plan', 'active');
    updateProgress(40);

    const planResult = await window.api.runTerraform('plan', state.extractPath);

    if (!planResult.success) {
      updateStepStatus('plan', 'error');
      throw new Error('Terraform plan failed');
    }

    updateStepStatus('plan', 'completed');
    updateProgress(66);

    state.planResult = planResult.output;

    // 디버그 로그
    console.log('[DEBUG] Plan result:', planResult);
    console.log('[DEBUG] Output:', planResult.output);
    console.log('[DEBUG] Has changes:', planResult.output?.hasChanges);
    console.log('[DEBUG] Resource changes:', planResult.output?.resourceChanges);

    // Plan 결과 확인 화면으로 이동
    const hasChanges = planResult.output &&
                      planResult.output.resourceChanges &&
                      (planResult.output.resourceChanges.toAdd > 0 ||
                       planResult.output.resourceChanges.toChange > 0 ||
                       planResult.output.resourceChanges.toDestroy > 0);

    if (hasChanges) {
      // 변경사항이 있으면 Plan 결과 화면으로
      addLog('info', `${planResult.output.resourceChanges.toAdd}개 리소스 생성 예정`);
      showPlanResults(planResult.output.resourceChanges);
    } else {
      // 변경사항이 없으면 바로 완료
      addLog('info', '변경사항이 없습니다. 인프라가 이미 최신 상태입니다.');
      state.endTime = Date.now();
      showCompleteScreen();
    }
  } catch (error) {
    addLog('error', `오류 발생: ${error.message}`);
    document.getElementById('restart-btn').disabled = false;
  }
}

// Apply 실행
async function runTerraformApply() {
  showScreen('execution-screen');
  updateStepStatus('apply', 'active');
  updateProgress(70);

  try {
    const applyResult = await window.api.runTerraform('apply', state.extractPath);

    if (!applyResult.success) {
      updateStepStatus('apply', 'error');
      throw new Error('Terraform apply failed');
    }

    updateStepStatus('apply', 'completed');
    updateProgress(100);

    state.applyResult = applyResult.output;
    state.endTime = Date.now();
    showCompleteScreen();
  } catch (error) {
    addLog('error', `Apply 실패: ${error.message}`);
    showError(`Apply 실패: ${error.message}`);
  }
}

// 단계 상태 업데이트
function updateStepStatus(step, status) {
  const stepElement = document.getElementById(`step-${step}`);
  if (!stepElement) return;

  stepElement.className = 'step';
  stepElement.classList.add(`step-${status}`);

  const icons = {
    pending: '⏸️',
    active: '🔄',
    completed: '✅',
    error: '❌',
  };

  const iconElement = stepElement.querySelector('.step-icon');
  if (iconElement) {
    iconElement.textContent = icons[status] || '⏸️';
  }
}

// 진행률 업데이트
function updateProgress(percent) {
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');

  if (progressFill) {
    progressFill.style.width = `${percent}%`;
  }

  if (progressPercent) {
    progressPercent.textContent = Math.round(percent);
  }
}

// ANSI 색상 코드를 HTML로 변환
function ansiToHtml(text) {
  const ansiColorMap = {
    '30': '#000000', // 검정
    '31': '#e74c3c', // 빨강
    '32': '#2ecc71', // 초록
    '33': '#f39c12', // 노랑
    '34': '#3498db', // 파랑
    '35': '#9b59b6', // 마젠타
    '36': '#1abc9c', // 시안
    '37': '#ecf0f1', // 흰색
    '90': '#7f8c8d', // 밝은 검정 (회색)
    '91': '#ff6b6b', // 밝은 빨강
    '92': '#51cf66', // 밝은 초록
    '93': '#ffd43b', // 밝은 노랑
    '94': '#74c0fc', // 밝은 파랑
    '95': '#da77f2', // 밝은 마젠타
    '96': '#3bc9db', // 밝은 시안
    '97': '#ffffff', // 밝은 흰색
  };

  let html = text;
  let currentColor = null;
  let isBold = false;

  // ANSI escape sequences 파싱
  // eslint-disable-next-line no-control-regex
  html = html.replace(/\x1B\[([0-9;]*)m/g, (match, codes) => {
    if (!codes || codes === '0') {
      // 리셋
      const closeTag = currentColor || isBold ? '</span>' : '';
      currentColor = null;
      isBold = false;
      return closeTag;
    }

    const codeList = codes.split(';');
    let styles = [];
    let closeTag = '';

    if (currentColor || isBold) {
      closeTag = '</span>';
      currentColor = null;
      isBold = false;
    }

    for (const code of codeList) {
      if (code === '1') {
        // 굵게
        isBold = true;
        styles.push('font-weight: bold');
      } else if (ansiColorMap[code]) {
        // 색상
        currentColor = ansiColorMap[code];
        styles.push(`color: ${ansiColorMap[code]}`);
      }
    }

    if (styles.length > 0) {
      return `${closeTag}<span style="${styles.join('; ')}">`;
    }
    return closeTag;
  });

  // 닫히지 않은 태그 정리
  if (currentColor || isBold) {
    html += '</span>';
  }

  return html;
}

// 로그 추가
function addLog(type, message) {
  // 로컬 시간으로 표시 (HH:MM:SS 형식)
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${hours}:${minutes}:${seconds}`;

  // ANSI 색상 코드를 HTML로 변환
  const htmlMessage = ansiToHtml(message);

  // 저장용으로는 ANSI 코드 제거
  // eslint-disable-next-line no-control-regex
  const cleanMessage = message.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

  const log = {
    type,
    message: cleanMessage,
    timestamp,
  };

  state.logs.push(log);

  const logOutput = document.getElementById('log-output');
  if (logOutput) {
    const logLine = document.createElement('div');
    logLine.className = `log-line log-${type}`;
    logLine.innerHTML = `[${timestamp}] ${htmlMessage}`;
    logOutput.appendChild(logLine);

    // 자동 스크롤
    logOutput.scrollTop = logOutput.scrollHeight;
  }
}

// 로그 복사
document.getElementById('copy-log-btn').addEventListener('click', () => {
  const logText = state.logs.map((log) => `[${log.timestamp}] ${log.message}`).join('\n');
  navigator.clipboard.writeText(logText).then(() => {
    addLog('info', '로그가 클립보드에 복사되었습니다');
  });
});

// 로그 저장
document.getElementById('save-log-btn').addEventListener('click', async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `terraform-runner-${timestamp}.txt`;

  const result = await window.api.saveLogs(state.logs, filename);

  if (result.success) {
    addLog('success', `로그 저장 완료: ${result.path}`);
  } else {
    addLog('error', '로그 저장 실패');
  }
});

// 다시 실행
document.getElementById('restart-btn').addEventListener('click', () => {
  location.reload();
});

// 취소
document.getElementById('cancel-btn').addEventListener('click', () => {
  if (confirm('실행을 취소하고 처음으로 돌아가시겠습니까?')) {
    location.reload();
  }
});

// ============================================
// Plan Modal
// ============================================

function showPlanResults(resourceChanges) {
  // 모달 표시 (실행 화면은 그대로 유지)
  document.getElementById('plan-add-count').textContent = resourceChanges.toAdd || 0;
  document.getElementById('plan-change-count').textContent = resourceChanges.toChange || 0;
  document.getElementById('plan-destroy-count').textContent = resourceChanges.toDestroy || 0;

  document.getElementById('plan-modal').classList.add('active');
}

function hidePlanModal() {
  document.getElementById('plan-modal').classList.remove('active');
}

document.getElementById('cancel-plan-btn').addEventListener('click', () => {
  hidePlanModal();
});

document.getElementById('apply-btn').addEventListener('click', async () => {
  hidePlanModal();
  await runTerraformApply();
});

// ============================================
// Complete Screen
// ============================================

function showCompleteScreen() {
  showScreen('complete-screen');

  // 소요 시간 계산
  if (state.startTime && state.endTime) {
    const duration = Math.floor((state.endTime - state.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    document.getElementById('total-time').textContent = `${minutes}분 ${seconds}초`;
  }

  // 리소스 통계
  if (state.applyResult && state.applyResult.resourceChanges) {
    const changes = state.applyResult.resourceChanges;
    document.getElementById('resources-added').textContent = `${changes.added || 0}개`;
    document.getElementById('resources-changed').textContent = `${changes.changed || 0}개`;
    document.getElementById('resources-destroyed').textContent = `${changes.destroyed || 0}개`;
  } else {
    // Apply 안 했으면 0으로 표시
    document.getElementById('resources-added').textContent = '0개';
    document.getElementById('resources-changed').textContent = '0개';
    document.getElementById('resources-destroyed').textContent = '0개';
  }

  // Terraform Outputs
  const outputsCard = document.getElementById('outputs-card');
  const outputsDisplay = document.getElementById('outputs-display');

  if (state.applyResult && state.applyResult.terraformOutputs) {
    outputsCard.style.display = 'block';

    // ANSI 색상 코드를 HTML로 변환하여 색상 표시
    const htmlOutputs = ansiToHtml(state.applyResult.terraformOutputs);
    outputsDisplay.innerHTML = htmlOutputs;
  } else {
    outputsCard.style.display = 'none';
  }

  // Destroy 버튼 표시 (Apply가 성공한 경우에만)
  const destroyBtn = document.getElementById('destroy-btn');
  if (state.applyResult && state.applyResult.resourceChanges && state.applyResult.resourceChanges.added > 0) {
    destroyBtn.style.display = 'inline-block';
  } else {
    destroyBtn.style.display = 'none';
  }
}

document.getElementById('copy-outputs-btn').addEventListener('click', () => {
  // Outputs 복사 시에는 ANSI 코드 제거한 깔끔한 텍스트로
  const outputsText = state.applyResult && state.applyResult.terraformOutputs
    // eslint-disable-next-line no-control-regex
    ? state.applyResult.terraformOutputs.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    : '';

  navigator.clipboard.writeText(outputsText).then(() => {
    alert('Outputs가 클립보드에 복사되었습니다');
  });
});

document.getElementById('view-log-btn').addEventListener('click', () => {
  showScreen('execution-screen');
});

document.getElementById('home-btn').addEventListener('click', () => {
  if (confirm('처음 화면으로 돌아가시겠습니까? (현재 세션 정보가 초기화됩니다)')) {
    location.reload();
  }
});

// ============================================
// Destroy Modal & Execution
// ============================================

// Destroy 버튼 클릭
document.getElementById('destroy-btn').addEventListener('click', async () => {
  // 리소스 개수 표시
  const resourceCount = (state.applyResult && state.applyResult.resourceChanges)
    ? state.applyResult.resourceChanges.added || 0
    : 0;

  document.getElementById('destroy-resource-count').textContent = resourceCount;
  document.getElementById('destroy-modal').classList.add('active');
});

// Destroy 취소
document.getElementById('cancel-destroy-btn').addEventListener('click', () => {
  document.getElementById('destroy-modal').classList.remove('active');
});

// Destroy 확인 및 실행
document.getElementById('confirm-destroy-btn').addEventListener('click', async () => {
  document.getElementById('destroy-modal').classList.remove('active');

  // terraform.tfvars 생성 (아직 안 했으면)
  if (state.extractPath && state.tfVariableValues && Object.keys(state.tfVariableValues).length > 0) {
    const generateResult = await window.api.generateTfvars(
      state.extractPath,
      state.tfVariableValues
    );
    if (!generateResult.success) {
      showError(`변수 파일 생성 실패: ${generateResult.error}`);
      return;
    }
    addLog('info', 'terraform.tfvars 생성 완료');
  }

  // AWS 설정
  addLog('info', 'AWS 자격증명 설정 중...');
  const awsResult = await window.api.configureAWS(state.credentials);

  if (!awsResult.success) {
    showError(`AWS 설정 실패: ${awsResult.error}`);
    return;
  }

  addLog('success', 'AWS 설정 완료');

  // Execution 화면으로 전환
  showScreen('execution-screen');

  // Destroy 모드 설정
  setupDestroyMode();

  state.startTime = Date.now();

  addLog('info', '🗑️ Terraform Destroy를 시작합니다...');
  addLog('warning', '⚠️ 모든 리소스가 삭제됩니다!');

  try {
    // Init 실행
    updateStepStatus('init', 'active');
    updateProgress(10);
    addLog('info', 'Terraform 초기화 중...');

    const initResult = await window.api.runTerraform('init', state.extractPath);

    if (!initResult.success) {
      updateStepStatus('init', 'error');
      addLog('error', `❌ Init 실패: ${initResult.error}`);
      showError(`Init 실패: ${initResult.error}`);
      return;
    }

    updateStepStatus('init', 'completed');
    updateProgress(50);
    addLog('success', '✅ Init 완료');

    // Destroy 실행
    updateStepStatus('destroy', 'active');
    updateProgress(60);
    addLog('info', '🗑️ Destroy 실행 중...');

    const destroyResult = await window.api.runTerraform('destroy', state.extractPath);

    if (!destroyResult.success) {
      updateStepStatus('destroy', 'error');
      addLog('error', `❌ Destroy 실패: ${destroyResult.error}`);
      showError(`Destroy 실패: ${destroyResult.error}`);
      return;
    }

    updateStepStatus('destroy', 'completed');
    updateProgress(100);
    addLog('success', '✅ Destroy 완료!');
    state.endTime = Date.now();

    // Destroy 결과 저장
    state.destroyResult = destroyResult.output;

    // Destroy 완료 화면으로 전환
    showDestroyCompleteScreen();
  } catch (error) {
    addLog('error', `❌ Destroy 오류: ${error.message}`);
    showError(`Destroy 오류: ${error.message}`);
  }
});

// Destroy 모드 설정 (실행 단계 표시 변경)
function setupDestroyMode() {
  // Plan/Apply 단계 숨기기
  document.getElementById('step-plan').style.display = 'none';
  document.getElementById('step-apply').style.display = 'none';

  // Destroy 단계 표시
  document.getElementById('step-destroy').style.display = 'flex';
}

// Destroy 완료 화면 표시
function showDestroyCompleteScreen() {
  showScreen('complete-screen');

  // 헤더 아이콘과 제목 변경
  const headerIcon = document.querySelector('#complete-screen .header-icon');
  const headerTitle = document.querySelector('#complete-screen .header-title');
  const headerSubtitle = document.querySelector('#complete-screen .header-subtitle');

  if (headerIcon) headerIcon.textContent = '🗑️';
  if (headerTitle) headerTitle.textContent = '리소스 삭제 완료';
  if (headerSubtitle) headerSubtitle.textContent = '모든 AWS 리소스가 성공적으로 삭제되었습니다';

  // 소요 시간 계산
  if (state.startTime && state.endTime) {
    const duration = Math.floor((state.endTime - state.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const totalTimeEl = document.getElementById('total-time');
    if (totalTimeEl) {
      totalTimeEl.textContent = `${minutes}분 ${seconds}초`;
    }
  }

  // 리소스 통계 (Destroy 결과)
  if (state.destroyResult && state.destroyResult.resourceChanges) {
    const destroyed = state.destroyResult.resourceChanges.destroyed || 0;
    document.getElementById('resources-added').textContent = '0개';
    document.getElementById('resources-changed').textContent = '0개';
    document.getElementById('resources-destroyed').textContent = `${destroyed}개`;
  } else {
    document.getElementById('resources-added').textContent = '0개';
    document.getElementById('resources-changed').textContent = '0개';
    document.getElementById('resources-destroyed').textContent = '알 수 없음';
  }

  // Outputs 숨기기 (Destroy는 outputs 없음)
  const outputsCard = document.getElementById('outputs-card');
  if (outputsCard) {
    outputsCard.style.display = 'none';
  }

  // Destroy 버튼 숨김
  const destroyBtn = document.getElementById('destroy-btn');
  if (destroyBtn) {
    destroyBtn.style.display = 'none';
  }

  addLog('info', '💡 새로운 배포를 시작하려면 "처음으로" 버튼을 클릭하세요');
}

// ============================================
// Event Listeners (IPC)
// ============================================

// Terraform 로그 수신
window.api.onTerraformLog((log) => {
  addLog(log.type, log.message);
});

// 진행률 업데이트 수신
window.api.onProgressUpdate((progress) => {
  if (progress.progress) {
    updateProgress(progress.progress);
  }
});

// 단계 완료 알림 수신
window.api.onStepComplete((data) => {
  console.log('Step complete:', data);
});

// 오류 알림 수신
window.api.onError((error) => {
  addLog('error', `${error.step} 오류: ${error.error}`);
});

// ============================================
// Error Modal
// ============================================

function showError(message) {
  document.getElementById('error-message').textContent = message;
  document.getElementById('error-modal').classList.add('active');
}

document.getElementById('close-error-btn').addEventListener('click', () => {
  document.getElementById('error-modal').classList.remove('active');
});

// ============================================
// AWS CLI Install Modal
// ============================================

function showAWSCliInstallModal() {
  document.getElementById('aws-cli-install-modal').classList.add('active');
}

function hideAWSCliInstallModal() {
  document.getElementById('aws-cli-install-modal').classList.remove('active');
}

// 설치 시작
document.getElementById('start-install-btn').addEventListener('click', async () => {
  const startBtn = document.getElementById('start-install-btn');
  const cancelBtn = document.getElementById('cancel-install-btn');
  const progressDiv = document.getElementById('install-progress');

  // 버튼 비활성화
  startBtn.disabled = true;
  cancelBtn.disabled = true;

  // 진행률 표시
  progressDiv.style.display = 'block';

  try {
    // 1. 다운로드
    updateInstallProgress(0, '다운로드 중...', '');

    const downloadResult = await window.api.downloadAWSCli();

    if (!downloadResult.success) {
      throw new Error(downloadResult.error || '다운로드 실패');
    }

    // 2. 설치
    updateInstallProgress(50, '설치 중...', '잠시만 기다려주세요...');

    const installResult = await window.api.installAWSCli();

    if (installResult.success) {
      updateInstallProgress(100, '설치 완료!', 'AWS CLI가 성공적으로 설치되었습니다.');

      // 1초 후 모달 닫기
      setTimeout(() => {
        hideAWSCliInstallModal();

        // 앱 상태 다시 확인
        checkAppStatus();

        // 성공 메시지
        alert('AWS CLI 설치가 완료되었습니다.\n앱을 재시작하면 변경사항이 적용됩니다.');
      }, 1500);
    } else {
      throw new Error(installResult.error || '설치 실패');
    }
  } catch (error) {
    updateInstallProgress(0, '오류 발생', error.message);
    showError(`AWS CLI 설치 실패: ${error.message}`);

    // 버튼 다시 활성화
    startBtn.disabled = false;
    cancelBtn.disabled = false;
  }
});

// 설치 취소
document.getElementById('cancel-install-btn').addEventListener('click', () => {
  hideAWSCliInstallModal();
});

// 설치 진행률 업데이트
function updateInstallProgress(percent, label, status) {
  const progressFill = document.getElementById('install-progress-fill');
  const progressLabel = document.getElementById('install-progress-label');
  const progressStatus = document.getElementById('install-progress-status');

  if (progressFill) {
    progressFill.style.width = `${percent}%`;
  }

  if (progressLabel) {
    progressLabel.textContent = label;
  }

  if (progressStatus) {
    progressStatus.textContent = status;
  }
}

// 다운로드 진행률 이벤트
window.api.onAWSCliDownloadProgress((progress) => {
  updateInstallProgress(
    progress.progress / 2, // 다운로드는 0-50%
    '다운로드 중...',
    `${progress.downloaded} / ${progress.total}`
  );
});

// 설치 로그 이벤트
window.api.onAWSCliInstallLog((log) => {
  console.log('[AWS CLI Install]', log.message);
});

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Terraform Runner initialized');

  // 앱 상태 확인
  await checkAppStatus();

  // 초기 화면 표시
  showScreen('setup-screen');
});

