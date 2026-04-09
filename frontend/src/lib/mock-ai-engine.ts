// Mock AI Engine — 100% client-side
// Updated flow: interview → recommend → detail → financial → contact_info → booking → handoff

import {
  carModels,
  getRecommendedCars,
  getCarById,
  type CarModel,
} from './vinfast-data';
import {
  calculateLoan,
  calculateFullPayment,
  findOptimalLoan,
  type FinanceResult,
} from './finance-calculator';
import type { ChatPhase, UserProfile, RichContent } from '@/store/chat-store';

export interface MockResponse {
  content: string;
  phase?: ChatPhase;
  profileUpdates?: Partial<UserProfile>;
  recommendedCars?: CarModel[];
  selectedCar?: CarModel | null;
  financeResult?: FinanceResult | null;
  richContent?: RichContent[];
}

export function generateMockResponse(
  message: string,
  phase: ChatPhase,
  profile: UserProfile,
  selectedCar: CarModel | null,
): MockResponse {
  const msg = message.toLowerCase();
  const result: MockResponse = { content: '' };
  const profileUpdates = extractProfile(message);
  const merged = { ...profile, ...profileUpdates };
  if (Object.keys(profileUpdates).length > 0) result.profileUpdates = profileUpdates;

  // Handoff / sale transfer
  if (/chuyển sale|nhân viên|gặp sale|handoff/i.test(msg)) {
    result.phase = 'handoff';
    result.richContent = [{ type: 'profile-card' }];
    result.content = 'Em xin phép chuyển anh/chị cho nhân viên tư vấn. Em đã gửi toàn bộ thông tin cuộc trò chuyện để anh/chị không cần kể lại. Sales sẽ gọi lại cho anh/chị trong ít phút!';
    return result;
  }

  // Reset
  if (phase === 'completed' && /xin chào|hello|chào/i.test(msg)) {
    result.phase = 'idle';
    result.content = 'Xin chào anh! Em là trợ lý AI tư vấn VinFast. Em có thể giúp gì cho anh ạ?';
    return result;
  }

  // Booking — but require contact info first if missing
  if (/đặt lịch|lái thử|test drive|showroom/i.test(msg)) {
    if (!merged.name || !merged.phone) {
      result.phase = 'contact_info';
      result.richContent = [{ type: 'contact-form' }];
      result.content = selectedCar
        ? `Được chứ anh! Trước khi đặt lịch lái thử ${selectedCar.fullName}, em xin phép anh/chị để lại thông tin liên hệ để nhân viên showroom hỗ trợ tốt nhất nhé.`
        : 'Được chứ anh! Trước khi đặt lịch lái thử, em xin phép anh/chị để lại thông tin liên hệ để nhân viên showroom hỗ trợ tốt nhất nhé.';
      return result;
    }
    result.phase = 'booking';
    result.richContent = [{ type: 'booking-form' }];
    result.content = selectedCar
      ? `Được chứ anh! Em sẽ giúp anh đặt lịch lái thử ${selectedCar.fullName}. Vui lòng chọn showroom và khung giờ bên dưới nhé.`
      : 'Được chứ anh! Em sẽ giúp anh đặt lịch lái thử. Vui lòng chọn showroom và khung giờ bên dưới nhé.';
    return result;
  }

  // Product comparison
  if (/so sánh|compare|vf5.*vf6|vf6.*vf5/i.test(msg)) {
    return generateComparisonResponse(merged, msg);
  }

  // Car detail request
  if (/chi tiết|thông số|spec|đặc điểm|giới thiệu/i.test(msg) && !/chi phí|giá|tính/i.test(msg)) {
    return generateDetailResponse(merged, msg);
  }

  // Finance calculation
  if ((phase === 'financial' || phase === 'recommendation' || phase === 'detail') &&
      (/tính|chi phí|góp|trả góp|trả trước|thu nhập|ngân sách|giá/i.test(msg))) {
    return generateFinanceResponse(merged, selectedCar);
  }

  // Car mention → show detail
  const carMention = detectCarMention(msg);
  if (carMention) {
    if (/chi phí|giá|tính|góp/i.test(msg)) {
      return generateFinanceResponse(merged, carMention);
    }
    return generateDetailResponse(merged, msg, carMention);
  }

  // Recommendation trigger
  if (phase === 'interviewing' &&
      (/tìm xe|gợi ý|đề xuất|nhu cầu|gia đình|đi làm|chở|xe/i.test(msg) || profileUpdates.passengers)) {
    return generateRecommendationResponse(merged);
  }

  return generatePhaseResponse(phase, merged, selectedCar);
}

// ─── Generators ────────────────────────────────────────────────────────────────

function generateRecommendationResponse(profile: UserProfile): MockResponse {
  const cars = getRecommendedCars({
    passengers: profile.passengers || 4,
    monthlyKm: profile.monthlyKm || 1500,
    budgetMonthly: profile.monthlyBudget || undefined,
    budgetTotal: profile.totalBudget || undefined,
  });

  if (cars.length === 0) {
    return { content: 'Em xin lỗi, em chưa tìm thấy xe phù hợp. Anh cho em biết thêm về ngân sách và số người nhé!', phase: 'interviewing' };
  }

  const highlight = cars.map(c => `**${c.fullName}** — ${c.seats} chỗ, ${c.range}km tầm vãng`).join('\n');

  return {
    content: `Với nhu cầu${profile.passengers ? ` ${profile.passengers} người` : ''}${profile.monthlyKm ? `, ${profile.monthlyKm.toLocaleString()}km/tháng` : ''}, em gợi ý 2 mẫu xe phù hợp nhất:

${highlight}

Anh nhấn vào xe để xem chi tiết thông số, hoặc nói "so sánh VF5 và VF6" để xem bảng so sánh nhé!`,
    phase: 'recommendation',
    recommendedCars: cars.slice(0, 3),
    richContent: [{ type: 'car-cards', data: cars.slice(0, 2) }],
  };
}

function generateDetailResponse(profile: UserProfile, msg: string, forcedCar?: CarModel | null): MockResponse {
  let car = forcedCar || detectCarMention(msg);
  if (!car) car = carModels[0];

  return {
    content: `Đây là thông tin chi tiết về ${car.fullName}:

Phù hợp nhất cho: ${car.bestFor.join(', ')}

Anh muốn em tính chi phí, hoặc so sánh ${car.name} với mẫu xe khác không ạ?`,
    phase: 'detail',
    selectedCar: car,
    richContent: [{ type: 'car-detail', data: car }],
  };
}

function generateComparisonResponse(profile: UserProfile, msg: string): MockResponse {
  let car1: CarModel | undefined;
  let car2: CarModel | undefined;

  if (/vf ?3.*vf ?5/i.test(msg) || /vf ?5.*vf ?3/i.test(msg)) {
    car1 = getCarById('vf3'); car2 = getCarById('vf5-plus');
  } else if (/vf ?5.*vf ?6/i.test(msg) || /vf ?6.*vf ?5/i.test(msg)) {
    car1 = getCarById('vf5-plus'); car2 = getCarById('vf6-plus');
  } else if (/vf ?6.*vf ?8/i.test(msg) || /vf ?8.*vf ?6/i.test(msg)) {
    car1 = getCarById('vf6-plus'); car2 = getCarById('vf8-plus');
  } else if (/vf ?5.*vf ?8/i.test(msg) || /vf ?8.*vf ?5/i.test(msg)) {
    car1 = getCarById('vf5-plus'); car2 = getCarById('vf8-plus');
  }

  // Default: compare the recommended cars
  if (!car1 || !car2) {
    const recommended = getRecommendedCars({ passengers: profile.passengers || 4, monthlyKm: profile.monthlyKm || 1500 });
    if (recommended.length >= 2) {
      car1 = recommended[0];
      car2 = recommended[1];
    } else {
      car1 = carModels[0];
      car2 = carModels[1];
    }
  }

  const winner = car2.range > car1.range ? car2.fullName : car1.fullName;

  return {
    content: `So sánh chi tiết ${car1.fullName} và ${car2.fullName}:

Bảng bên dưới so sánh toàn bộ thông số. Mục đánh dấu ✓ là mẫu xe mạnh hơn ở tiêu chí đó.

Nói chung, ${winner} có lợi thế về tầm vãng và không gian. Anh muốn xem chi tiết mẫu nào, hoặc tính chi phí luôn ạ?`,
    phase: 'detail',
    richContent: [{ type: 'product-comparison', data: { car1, car2 } }],
  };
}

function generateFinanceResponse(profile: UserProfile, car: CarModel | null): MockResponse {
  const selectedCar = car || carModels[0];
  const income = profile.monthlyIncome || 25000000;
  const monthlyBudget = profile.monthlyBudget || 12000000;
  const downPayment = profile.downPaymentBudget || 300000000;
  const monthlyKm = profile.monthlyKm || 1500;

  let financeResult: FinanceResult;

  if (income >= selectedCar.priceOnRoad * 0.8) {
    financeResult = calculateFullPayment(selectedCar, monthlyKm, income);
    return {
      content: `Anh có khả năng tài chính tốt — em tính cả phương án mua thẳng ${selectedCar.fullName}:

Chi phí hàng tháng chỉ còn tiền điện sạc + bảo hiểm xe (pin đi kèm xe, không cần trả thêm).

Bảng chi tiết bên dưới. Anh muốn so sánh sản phẩm, hay đặt lịch lái thử luôn ạ?`,
      phase: 'financial',
      selectedCar,
      financeResult,
      richContent: [{ type: 'finance-table', data: financeResult }],
    };
  }

  financeResult = findOptimalLoan(selectedCar, monthlyKm, income, downPayment, monthlyBudget);

  const affordMsg = financeResult.affordability === 'affordable'
    ? 'Tổng chi phí nằm trong khả năng tài chính của anh.'
    : financeResult.affordability === 'tight'
    ? 'Chi phí khá sát ngân sách, anh nên cân nhắc thêm khoản dự phòng.'
    : 'Chi phí vượt ngân sách đề xuất. Em có thể gợi ý phương án khác.';

  return {
    content: `Em đã tính toán chi phí cho ${selectedCar.fullName}:

📊 **Gói tối ưu:** Trả trước ${new Intl.NumberFormat('vi-VN').format(financeResult.downPayment)}đ, góp ${financeResult.loanTerm} tháng qua ${financeResult.bankName}.

${affordMsg}

Bảng chi tiết bên dưới. Pin đi kèm xe nên không cần trả phí thuê riêng!`,
    phase: 'financial',
    selectedCar,
    financeResult,
    richContent: [{ type: 'finance-table', data: financeResult }],
  };
}

function generatePhaseResponse(phase: ChatPhase, profile: UserProfile, selectedCar: CarModel | null): MockResponse {
  switch (phase) {
    case 'idle':
      return { content: 'Em là trợ lý AI VinFast — giúp anh tìm xe phù hợp, tính chi phí, đặt lịch lái thử. Anh đang tìm xe cho gia đình mấy người ạ?', phase: 'interviewing' };

    case 'interviewing': {
      const missing: string[] = [];
      if (!profile.monthlyIncome) missing.push('mức thu nhập');
      if (!profile.monthlyBudget) missing.push('ngân sách góp mỗi tháng');
      if (!profile.monthlyKm) missing.push('quãng đường đi ước tính');
      if (missing.length > 0) {
        return {
          content: `Em hiểu rồi! Để em tư vấn chính xác hơn, anh cho em hỏi thêm: ${missing.join(', ')} ạ?\n\nVí dụ: "Thu nhập 25 triệu, góp tối đa 12 triệu/tháng, đi khoảng 1500km/tháng"`,
        };
      }
      return generateRecommendationResponse(profile);
    }

    case 'recommendation':
      return { content: selectedCar ? `Anh muốn xem chi tiết thông số ${selectedCar.fullName}, so sánh với mẫu xe khác, hay tính chi phí ạ?` : 'Anh nhấn vào xe muốn xem chi tiết, hoặc nói "so sánh VF5 và VF6" nhé!', phase: 'recommendation' };

    case 'detail':
      return { content: selectedCar ? `${selectedCar.fullName} là lựa chọn rất tốt! Anh muốn em tính chi phí, so sánh với mẫu xe khác, hay đặt lịch lái thử luôn ạ?` : 'Anh muốn em tính chi phí hay so sánh mẫu xe nào ạ?' };

    case 'financial': {
      // Auto-transition to contact_info after finance if name/phone missing
      if (!profile.name || !profile.phone) {
        return {
          content: `Bên trên là bảng chi phí chi tiết. Pin đi kèm xe nên không cần trả thêm phí thuê riêng.

Trước khi đặt lịch lái thử, em xin phép anh/chị để lại thông tin liên hệ để nhân viên showroom hỗ trợ tốt nhất nhé!`,
          phase: 'contact_info',
          richContent: [{ type: 'contact-form' }],
        };
      }
      return {
        content: `Bên trên là bảng chi phí chi tiết. Pin đi kèm xe nên không cần trả thêm phí thuê riêng.

Anh ${profile.name} muốn đặt lịch lái thử luôn để trải nghiệm xe thực tế không ạ?`,
        phase: 'financial',
      };
    }

    case 'contact_info':
      return { content: 'Anh vui lòng điền thông tin liên hệ bên dưới để em hỗ trợ đặt lịch nhé!', phase: 'contact_info', richContent: [{ type: 'contact-form' }] };

    case 'booking':
      return { content: 'Anh chọn showroom và khung giờ bên dưới nhé. Sau khi xác nhận, nhân viên tư vấn sẽ gọi lại cho anh!', phase: 'booking' };

    case 'handoff':
      return { content: 'Em đã gửi thông tin cho nhân viên tư vấn. Sales sẽ liên hệ anh trong ít phút. Anh còn cần hỗ trợ gì thêm không ạ?' };

    case 'completed':
      return { content: 'Cảm ơn anh đã trò chuyện với em! Nếu cần hỗ trợ thêm, em luôn ở đây!' };

    default:
      return { content: 'Em xin lỗi, em chưa hiểu. Anh/chị có thể nhắc lại được không ạ?' };
  }
}

// ─── Profile Extraction ────────────────────────────────────────────────────────

function extractProfile(message: string): Partial<UserProfile> {
  const u: Partial<UserProfile> = {};

  const pMatch = message.match(/(\d+)\s*(người|chỗ|ng\s)/i);
  if (pMatch) { const n = parseInt(pMatch[1]); if (n >= 1 && n <= 10) u.passengers = n; }

  const kmDaily = message.match(/([\d.]+)\s*km\s*\/?\s*(ngày|day)/i);
  if (kmDaily) { const d = parseFloat(kmDaily[1].replace('.', '')); if (d > 0) u.monthlyKm = Math.round(d * 30); }
  else {
    const kmMonthly = message.match(/([\d.]+)\s*(km|quilomet)/i);
    if (kmMonthly) { const k = parseFloat(kmMonthly[1].replace('.', '')); if (k > 100) u.monthlyKm = Math.round(k); }
  }

  const incMatch = message.match(/(?:thu nhập|lương|tiền)\s*(?:khoảng|~)?\s*([\d.]+)\s*(triệu|tr|million)/i);
  if (incMatch) u.monthlyIncome = parseFloat(incMatch[1].replace('.', '')) * 1000000;

  const budMatch = message.match(/(?:góp|trả góp)\s*(?:tối đa)?\s*(?:khoảng|~)?\s*([\d.]+)\s*(triệu|tr)\s*(?:\/|mỗi)?\s*(?:tháng|month)/i)
    || message.match(/ngân sách\s*(?:góp|trả góp)?\s*(?:tối đa|khoảng|~)?\s*([\d.]+)\s*(triệu|tr)/i);
  if (budMatch) u.monthlyBudget = parseFloat(budMatch[1].replace('.', '')) * 1000000;

  const downMatch = message.match(/(?:trả trước)\s*(?:khoảng|~)?\s*([\d.]+)\s*(triệu|tr)/i);
  if (downMatch) u.downPaymentBudget = parseFloat(downMatch[1].replace('.', '')) * 1000000;

  const nameMatch = message.match(/(?:tôi là|mình là|em là|i'm|i am)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,3})/i);
  if (nameMatch) u.name = nameMatch[1].trim();

  const phoneMatch = message.match(/(?:số|sđt|điện thoại)[:\s]*(\d{9,11})/i) || message.match(/\b(0[3-9]\d{8,9})\b/);
  if (phoneMatch) u.phone = phoneMatch[1];

  return u;
}

function detectCarMention(msg: string): CarModel | null {
  if (/vf ?5/i.test(msg)) return getCarById('vf5-plus') || carModels[0];
  if (/vf ?6/i.test(msg)) return getCarById('vf6-plus') || carModels[1];
  if (/vf ?8/i.test(msg)) return getCarById('vf8-plus') || carModels[3];
  if (/vf ?3/i.test(msg)) return getCarById('vf3') || carModels[2];
  return null;
}
