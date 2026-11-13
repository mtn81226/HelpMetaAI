import json

# ==================== WF04 ====================
with open('n8n-workflows/WF04_team-assignment.json') as f:
    wf4 = json.load(f)

# Node 3: Validate Required Fields -> IF
n3_4 = next(n for n in wf4['nodes'] if n['name'] == 'Validate Required Fields')
n3_4['type'] = 'n8n-nodes-base.if'
n3_4['typeVersion'] = 1
n3_4['parameters'] = {
    'conditions': {
        'string': [
            {'value1': '={{ $json.title }}', 'operation': 'isNotEmpty'}
        ]
    }
}

# Node 6: Select Support Team
n6_4 = next(n for n in wf4['nodes'] if n['name'] == 'Select Support Team')
n6_4['parameters']['jsCode'] = """const category = $json.category || 'Other';
const priority = $json.priority || 'Medium';
const baseTeams = {
  Network: 'Network Support',
  Hardware: 'Hardware Support',
  Software: 'Software Support',
  'Account & Access': 'Identity and Access Support',
  Security: 'Security Operations',
  Other: 'IT General'
};
let team = $json.assignedTeam || baseTeams[category] || baseTeams.Other;
if (priority === 'Critical' || priority === 'High') {
  if (category === 'Security') team = 'Security Operations (Tier 2 Incident Response)';
  else if (category === 'Network' || category === 'Hardware') team = 'Infrastructure Operations (Tier 2)';
  else team = 'Senior IT Support Team';
}
const baseQueues = {
  Network: 'queue-network',
  Hardware: 'queue-hardware',
  Software: 'queue-software',
  'Account & Access': 'queue-access',
  Security: 'queue-security',
  Other: 'queue-general'
};
let queue = baseQueues[category] || baseQueues.Other;
if (priority === 'Critical' || priority === 'High') {
  queue = queue + '-escalated';
}
return [{ json: { ...$json, assignedTeam: team, assignmentQueue: queue } }];"""

# Node 7: Set Assignment Policy -> SET node
n7_4 = next(n for n in wf4['nodes'] if n['name'] in ['Select Assignment Queue', 'Set Assignment Policy'])
n7_4['name'] = 'Set Assignment Policy'
n7_4['type'] = 'n8n-nodes-base.set'
n7_4['typeVersion'] = 1
n7_4['parameters'] = {
    'keepOnlySet': False,
    'values': {
        'string': [
            {'name': 'routingPolicy', 'value': 'tier-based'},
            {'name': 'routingTier', 'value': '={{ $json.priority === "Critical" || $json.priority === "High" ? "Tier-2" : "Tier-1" }}'}
        ]
    },
    'options': {}
}

# Node 9: Check Assignment Completeness -> IF
n9_4 = next(n for n in wf4['nodes'] if n['name'] == 'Check Assignment Completeness')
n9_4['type'] = 'n8n-nodes-base.if'
n9_4['typeVersion'] = 1
n9_4['parameters'] = {
    'conditions': {
        'string': [
            {'value1': '={{ $json.assignedTeam }}', 'operation': 'isNotEmpty'}
        ]
    }
}

names4 = [n['name'] for n in wf4['nodes']]
wf4['connections'] = {names4[i]: {'main': [[{'node': names4[i+1], 'type': 'main', 'index': 0}]]} for i in range(len(names4) - 1)}

with open('n8n-workflows/WF04_team-assignment.json', 'w', encoding='utf-8') as f:
    json.dump(wf4, f, indent=2, ensure_ascii=False)
print('WF04 written successfully!')


# ==================== WF05 ====================
with open('n8n-workflows/WF05_duplicate-detection.json') as f:
    wf5 = json.load(f)

# Node 3: Validate Required Fields -> IF
n3_5 = next(n for n in wf5['nodes'] if n['name'] == 'Validate Required Fields')
n3_5['type'] = 'n8n-nodes-base.if'
n3_5['typeVersion'] = 1
n3_5['parameters'] = {
    'conditions': {
        'string': [
            {'value1': '={{ $json.title }}', 'operation': 'isNotEmpty'}
        ]
    }
}

# Node 6: Create Duplicate Fingerprint
n6_5 = next(n for n in wf5['nodes'] if n['name'] == 'Create Duplicate Fingerprint')
n6_5['parameters']['jsCode'] = """const rawText = $json.duplicateSearchText || '';
const stopwords = new Set([
  'toi', 'la', 'bi', 'khong', 'duoc', 'cho', 'va', 'tai', 'tren', 'trong',
  'nhung', 'cac', 'cua', 'nay', 'voi', 'lam', 'sao', 'gi', 'the', 'nao',
  'biet', 'xin', 'giup', 'can', 'alo', 'em', 'anh', 'chi', 'ticket', 'gap',
  'the', 'is', 'at', 'which', 'on', 'in', 'and', 'for', 'to', 'with'
]);
const words = rawText.split(' ').filter(w => w.length >= 3 && !stopwords.has(w));
const uniqueSorted = [...new Set(words)].sort();
const fingerprint = `${$json.category || 'Other'}|${uniqueSorted.slice(0, 15).join('|')}`;
const keywords = uniqueSorted.slice(0, 12);
const signature = `${$json.category || 'Other'}#${$json.priority || 'Medium'}#${keywords.slice(0, 4).sort().join('-')}`;
return [{ json: { ...$json, duplicateFingerprint: fingerprint, duplicateKeywords: keywords, duplicateSignature: signature } }];"""

# Node 7: Set Dedup Baseline -> SET
n7_5 = next(n for n in wf5['nodes'] if n['name'] in ['Extract Search Keywords', 'Set Dedup Baseline'])
n7_5['name'] = 'Set Dedup Baseline'
n7_5['type'] = 'n8n-nodes-base.set'
n7_5['typeVersion'] = 1
n7_5['parameters'] = {
    'keepOnlySet': False,
    'values': {
        'string': [
            {'name': 'dedupAlgorithm', 'value': 'unicode-nfd-signature'},
            {'name': 'dedupScope', 'value': 'active-tickets'}
        ]
    },
    'options': {}
}

# Node 9: Check Duplicate Context -> IF
n9_5 = next(n for n in wf5['nodes'] if n['name'] in ['Compare Available Ticket Context', 'Check Duplicate Context'])
n9_5['name'] = 'Check Duplicate Context'
n9_5['type'] = 'n8n-nodes-base.if'
n9_5['typeVersion'] = 1
n9_5['parameters'] = {
    'conditions': {
        'string': [
            {'value1': '={{ $json.duplicateFingerprint }}', 'operation': 'isNotEmpty'}
        ]
    }
}

names5 = [n['name'] for n in wf5['nodes']]
wf5['connections'] = {names5[i]: {'main': [[{'node': names5[i+1], 'type': 'main', 'index': 0}]]} for i in range(len(names5) - 1)}

with open('n8n-workflows/WF05_duplicate-detection.json', 'w', encoding='utf-8') as f:
    json.dump(wf5, f, indent=2, ensure_ascii=False)
print('WF05 written successfully!')


# ==================== WF06 ====================
with open('n8n-workflows/WF06_support-response.json') as f:
    wf6 = json.load(f)

# Node 3: Validate Required Fields -> IF
n3_6 = next(n for n in wf6['nodes'] if n['name'] == 'Validate Required Fields')
n3_6['type'] = 'n8n-nodes-base.if'
n3_6['typeVersion'] = 1
n3_6['parameters'] = {
    'conditions': {
        'string': [
            {'value1': '={{ $json.title }}', 'operation': 'isNotEmpty'}
        ]
    }
}

# Node 5: Choose Category Guidance
n5_6 = next(n for n in wf6['nodes'] if n['name'] == 'Choose Category Guidance')
n5_6['parameters']['jsCode'] = """const text = (($json.title || '') + ' ' + ($json.description || '')).toLowerCase();
const category = $json.category || 'Other';
let actionSteps = [];
if (/wifi|wi-fi|mạng|network|internet|mất mạng/i.test(text)) {
  actionSteps = [
    '1. Tắt Wi-Fi trên thiết bị, chờ 10 giây và bật lại.',
    '2. Chọn "Quên mạng" (Forget Network) và kết nối lại đúng mạng công ty.',
    '3. Thử mở trình duyệt ở chế độ ẩn danh để kiểm tra cổng đăng nhập.'
  ];
} else if (/vpn|kết nối từ xa/i.test(text)) {
  actionSteps = [
    '1. Ngắt kết nối VPN hiện tại và đóng hoàn toàn ứng dụng VPN.',
    '2. Kiểm tra mạng Internet thông thường trước khi kết nối lại VPN.',
    '3. Xác nhận tài khoản xác thực 2 bước (2FA) vẫn đang hoạt động.'
  ];
} else if (/máy in|in|printer/i.test(text)) {
  actionSteps = [
    '1. Kiểm tra nguồn máy in, khay giấy và thông báo kẹt giấy.',
    '2. Khởi động lại dịch vụ Print Spooler hoặc khởi động lại máy in.',
    '3. Thử in một trang thử nghiệm (Test Page).'
  ];
} else if (/treo|đơ|crash|freeze|không phản hồi|lỗi phần mềm/i.test(text)) {
  actionSteps = [
    '1. Nhấn Ctrl + Shift + Esc mở Task Manager và buộc dừng ứng dụng bị đơ.',
    '2. Kiểm tra cập nhật phần mềm hoặc khởi động lại máy tính.',
    '3. Chụp lại ảnh màn hình thông báo lỗi (nếu có) gửi kèm ticket.'
  ];
} else if (category === 'Security') {
  actionSteps = [
    '1. Ngắt ngay kết nối mạng (rút dây LAN hoặc tắt Wi-Fi).',
    '2. Tuyệt đối không nhấp vào đường link lạ hoặc mở file đính kèm.',
    '3. Giữ nguyên hiện trạng máy và chờ chuyên viên bảo mật tiếp cận khẩn cấp.'
  ];
} else {
  actionSteps = [
    '1. Lưu toàn bộ tài liệu đang mở và khởi động lại máy tính.',
    '2. Ghi lại thời điểm bắt đầu xảy ra sự cố và các thao tác trước đó.',
    '3. Chờ kỹ thuật viên liên hệ hỗ trợ trong thời gian cam kết.'
  ];
}
const responseGuidance = actionSteps.join(' ');
return [{ json: { ...$json, responseGuidance, responseActionSteps: actionSteps, firstTroubleshootingStep: actionSteps[0] } }];"""

# Node 7: Set Response Baseline -> SET
n7_6 = next(n for n in wf6['nodes'] if n['name'] in ['Add First Troubleshooting Step', 'Set Response Baseline'])
n7_6['name'] = 'Set Response Baseline'
n7_6['type'] = 'n8n-nodes-base.set'
n7_6['typeVersion'] = 1
n7_6['parameters'] = {
    'keepOnlySet': False,
    'values': {
        'string': [
            {'name': 'slaStandard', 'value': 'itil-v4'},
            {'name': 'securityPolicy', 'value': 'strict-no-credentials'}
        ]
    },
    'options': {}
}

# Node 8: Check Credential Safety -> IF
n8_6 = next(n for n in wf6['nodes'] if n['name'] in ['Apply Credential Safety Check', 'Check Credential Safety'])
n8_6['name'] = 'Check Credential Safety'
n8_6['type'] = 'n8n-nodes-base.if'
n8_6['typeVersion'] = 1
n8_6['parameters'] = {
    'conditions': {
        'string': [
            {'value1': '={{ $json.responseAcknowledgement }}', 'operation': 'isNotEmpty'}
        ]
    }
}

names6 = [n['name'] for n in wf6['nodes']]
wf6['connections'] = {names6[i]: {'main': [[{'node': names6[i+1], 'type': 'main', 'index': 0}]]} for i in range(len(names6) - 1)}

with open('n8n-workflows/WF06_support-response.json', 'w', encoding='utf-8') as f:
    json.dump(wf6, f, indent=2, ensure_ascii=False)
print('WF06 written successfully!')
