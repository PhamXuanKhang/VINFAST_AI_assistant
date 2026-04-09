// VinFast Vehicle Database - Static Data for Prototype

export interface CarModel {
  id: string;
  name: string;
  variant: string;
  fullName: string;
  category: 'city' | 'compact-suv' | 'suv' | 'electric-sedan';
  seats: number;
  range: number;
  batteryCapacity: number;
  motorPower: number;
  motorTorque: number;
  topSpeed: number;
  acceleration: string; // 0-100 km/h
  fastChargeTime: string;
  homeChargeTime: string;
  chargingPowerDC: string;
  bodyDimensions: { length: number; width: number; height: number };
  wheelbase: number;
  groundClearance: number;
  wheelSize: string;
  trunkCapacity: number;
  weight: number;
  priceOnRoad: number;
  priceBeforeTax: number;
  batteryWarrantyYears: number;
  vehicleWarrantyYears: number;
  drivetrain: string;
  suspension: string;
  braking: string;
  image: string;
  color: string;
  features: string[];
  bestFor: string[];
  pros: string[];
  cons: string[];
  description: string;
  available: boolean;
  showroomAvailable: boolean;
}

export interface Showroom {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  openHours: string;
  availableSlots: ShowroomSlot[];
}

export interface ShowroomSlot {
  date: string;
  timeSlots: { time: string; available: boolean }[];
}

export interface LoanPackage {
  bank: string;
  interestRate: number;
  maxTerm: number;
  minDownPayment: number;
  description: string;
}

export const carModels: CarModel[] = [
  {
    id: 'vf5-plus',
    name: 'VF 5',
    variant: 'Plus',
    fullName: 'VF 5 Plus',
    category: 'city',
    seats: 5,
    range: 301,
    batteryCapacity: 37.2,
    motorPower: 110,
    motorTorque: 180,
    topSpeed: 150,
    acceleration: '6.7 giây',
    fastChargeTime: '36 phút (10-80%)',
    homeChargeTime: '~5 giờ (0-100%)',
    chargingPowerDC: '47 kW',
    bodyDimensions: { length: 3875, width: 1728, height: 1583 },
    wheelbase: 2527,
    groundClearance: 178,
    wheelSize: '17 inch',
    trunkCapacity: 270,
    weight: 1315,
    priceOnRoad: 538000000,
    priceBeforeTax: 470000000,
    batteryWarrantyYears: 10,
    vehicleWarrantyYears: 10,
    drivetrain: 'FWD (Dẫn động cầu trước)',
    suspension: 'Trước: MacPherson - Sau: Thanh xoắn',
    braking: 'Đĩa trước/sau, hỗ trợ ABS + EBD',
    image: '/vf5-plus.svg',
    color: '#004cc3',
    features: [
      'Màn hình cảm ứng 10.6 inch',
      'Camera 360°',
      'Sạc nhanh DC',
      'Cruise Control thích ứng',
      '6 túi khí an toàn',
      'Đèn LED tự động',
      'Điều hòa tự động',
      'Hỗ trợ đỗ xe tự động',
      'Kết nối Apple CarPlay/Android Auto',
      'Cốp điện thông minh',
    ],
    bestFor: [
      'Di chuyển hàng ngày trong phố',
      'Gia đình nhỏ 3-4 người',
      'Người mới chuyển sang xe điện',
      'Ngân sách vừa phải',
    ],
    pros: [
      'Giá thành dễ tiếp cận nhất',
      'Tầm vãng 301km đủ dùng hàng ngày',
      'Chi phí vận hành thấp (~500đ/km)',
      'Thân thiện người mới dùng xe điện',
      'Kích thước nhỏ gọn, dễ đỗ xe',
    ],
    cons: [
      'Khoang hành lý khiêm tốn (270L)',
      'Không phù hợp đi đường dài liên tục',
      'Nội thất cơ bản so với VF6/VF8',
    ],
    description: 'VF 5 Plus là mẫu xe điện đô thị nhỏ gọn của VinFast, phù hợp cho nhu cầu di chuyển hàng ngày và gia đình nhỏ. Thiết kế năng động, trang bị an toàn vượt trội trong phân khúc, và chi phí vận hành rất thấp.',
    available: true,
    showroomAvailable: true,
  },
  {
    id: 'vf6-plus',
    name: 'VF 6',
    variant: 'Plus',
    fullName: 'VF 6 Plus',
    category: 'compact-suv',
    seats: 5,
    range: 399,
    batteryCapacity: 53.6,
    motorPower: 150,
    motorTorque: 260,
    topSpeed: 170,
    acceleration: '5.5 giây',
    fastChargeTime: '31 phút (10-80%)',
    homeChargeTime: '~6 giờ (0-100%)',
    chargingPowerDC: '80 kW',
    bodyDimensions: { length: 4295, width: 1838, height: 1603 },
    wheelbase: 2702,
    groundClearance: 190,
    wheelSize: '18 inch',
    trunkCapacity: 530,
    weight: 1710,
    priceOnRoad: 798000000,
    priceBeforeTax: 699000000,
    batteryWarrantyYears: 10,
    vehicleWarrantyYears: 10,
    drivetrain: 'FWD (Dẫn động cầu trước)',
    suspension: 'Trước: MacPherson - Sau: Đa liên kết',
    braking: 'Đĩa trước/sau, hỗ trợ ABS + EBD + BA',
    image: '/vf6-plus.svg',
    color: '#1a1c1f',
    features: [
      'Màn hình cảm ứng 15.6 inch',
      'Camera 360°',
      'Sạc nhanh DC 80kW',
      'Adaptive Cruise Control (ACC)',
      '8 túi khí an toàn',
      'Cửa sổ trời toàn cảnh',
      'Ghế da cao cấp',
      'Hệ thống ADAS Level 2',
      'Đèn LED Ma trận',
      'Tay lái trợ lực điện',
      'Kết nối Apple CarPlay/Android Auto không dây',
      'Hệ thống loa 8 âm thanh',
    ],
    bestFor: [
      'Gia đình 4 người đi chơi cuối tuần',
      'Di chuyển hàng ngày + cuối tuần',
      'Cần không gian rộng rãi hơn VF5',
      'Người thích công nghệ an toàn',
    ],
    pros: [
      'Tầm vãng 399km — đi Ba Vị/Vinh tắt nghỉ sạc',
      'Khoang hành lý rộng 530L',
      'ADAS Level 2 — an toàn chủ động toàn diện',
      'Nội thất cao cấp, ghế da',
      'Cửa sổ trời toàn cảnh',
    ],
    cons: [
      'Giá cao hơn VF5 đáng kể',
      'Kích thước lớn hơn hơi khó đỗ phố',
    ],
    description: 'VF 6 Plus là SUV gọn toàn điện hạng sang, kết hợp không gian rộng rãi, trang bị công nghệ hàng đầu và tầm vãng ấn tượng. Lựa chọn lý tưởng cho gia đình cần sự đa dụng.',
    available: true,
    showroomAvailable: true,
  },
  {
    id: 'vf3',
    name: 'VF 3',
    variant: 'Standard',
    fullName: 'VF 3',
    category: 'city',
    seats: 4,
    range: 201,
    batteryCapacity: 18.6,
    motorPower: 70,
    motorTorque: 125,
    topSpeed: 115,
    acceleration: '11.2 giây',
    fastChargeTime: '18 phút (10-80%)',
    homeChargeTime: '~3 giờ (0-100%)',
    chargingPowerDC: '36 kW',
    bodyDimensions: { length: 3144, width: 1624, height: 1592 },
    wheelbase: 2057,
    groundClearance: 164,
    wheelSize: '14 inch',
    trunkCapacity: 125,
    weight: 885,
    priceOnRoad: 235000000,
    priceBeforeTax: 200000000,
    batteryWarrantyYears: 8,
    vehicleWarrantyYears: 8,
    drivetrain: 'RWD (Dẫn động cầu sau)',
    suspension: 'Trước: MacPherson - Sau: Thanh xoắn',
    braking: 'Đĩa trước / Trống sau, ABS',
    image: '/vf3.svg',
    color: '#6b7280',
    features: [
      'Màn hình cảm ứng 8 inch',
      'Camera lùi',
      'Sạc nhanh DC',
      '2 túi khí an toàn',
      'Đèn LED',
      'Điều hòa thủ công',
      'Kết nối Bluetooth',
    ],
    bestFor: ['1-2 người', 'Di chuyển ngắn', 'Học sinh sinh viên', 'Xe thứ 2'],
    pros: ['Giá rẻ nhất', 'Nhỏ gọn', 'Sạc nhanh', 'Dễ đỗ xe'],
    cons: ['Chỉ 4 chỗ', 'Tầm vãng 201km', 'Ít tiện nghi', 'Quá nhỏ cho gia đình 4 người'],
    description: 'VF 3 là mẫu mini-car điện siêu nhỏ gọn với giá cực kỳ phải chăng. Phù hợp cho người đi làm một mình hoặc học sinh, sinh viên cần phương tiện di chuyển hàng ngày.',
    available: true,
    showroomAvailable: true,
  },
  {
    id: 'vf8',
    name: 'VF 8',
    variant: 'Plus',
    fullName: 'VF 8 Plus',
    category: 'suv',
    seats: 7,
    range: 471,
    batteryCapacity: 87.7,
    motorPower: 300,
    motorTorque: 440,
    topSpeed: 200,
    acceleration: '5.9 giây',
    fastChargeTime: '24 phút (10-80%)',
    homeChargeTime: '~8 giờ (0-100%)',
    chargingPowerDC: '150 kW',
    bodyDimensions: { length: 4800, width: 1930, height: 1700 },
    wheelbase: 2950,
    groundClearance: 200,
    wheelSize: '20 inch',
    trunkCapacity: 760,
    weight: 2470,
    priceOnRoad: 1229000000,
    priceBeforeTax: 1099000000,
    batteryWarrantyYears: 10,
    vehicleWarrantyYears: 10,
    drivetrain: 'AWD (Dẫn động 4 bánh)',
    suspension: 'Trước: MacPherson - Sau: Đa liên kết thích ứng',
    braking: 'Đĩa trước/sau, ABS + EBD + BA + AEB',
    image: '/vf8-plus.svg',
    color: '#374151',
    features: [
      'Màn hình 15.6 inch + HUD kính',
      'Camera 360° + Camera toàn cảnh',
      'Sạc nhanh DC 150kW',
      'ADAS Level 2+ (bao gồm lane change assist)',
      '11 túi khí an toàn',
      'Cửa sổ trời toàn cảnh',
      'Ghế da cao cấp + chỉnh điện',
      'Phanh tái sinh (Regenerative Braking)',
      'Hệ thống treo thích ứng',
      'Hệ thống loa 14 âm thanh',
      'Sạc không dây cho điện thoại',
      'Tay lái vô lăng bổ trợ',
    ],
    bestFor: ['Gia đình lớn', 'Chuyên gia', 'Nhu cầu sang trọng', 'Đi đường dài thường xuyên'],
    pros: [
      'Tầm vãng 471km — xuất sắc phân khúc',
      'SUV 7 chỗ rộng rãi',
      'Dẫn động 4 bánh AWD',
      'ADAS Level 2+ an toàn nhất',
      'Công nghệ và nội thất sang trọng',
    ],
    cons: [
      'Giá rất cao',
      'Kích thước lớn khó luồn lách phố',
      'Dư thừa cho nhu cầu cơ bản',
    ],
    description: 'VF 8 Plus là flagship SUV điện của VinFast, dành cho gia đình lớn và khách hàng cao cấp. Trang bị dẫn động 4 bánh, ADAS Level 2+, nội thất sang trọng và tầm vãng ấn tượng 471km.',
    available: true,
    showroomAvailable: true,
  },
];

export const showrooms: Showroom[] = [
  {
    id: 'showroom-long-bien',
    name: 'VinFast Showroom Long Biên',
    address: 'Số 7, đường Nguyễn Văn Cừ, phường Gia Thụy, quận Long Biên',
    district: 'Long Biên',
    city: 'Hà Nội',
    phone: '1900 23 23 86',
    openHours: '08:00 - 20:00',
    availableSlots: [
      {
        date: '2025-01-18',
        timeSlots: [
          { time: '08:00', available: false },
          { time: '09:00', available: true },
          { time: '10:00', available: true },
          { time: '11:00', available: false },
          { time: '13:00', available: true },
          { time: '14:00', available: true },
          { time: '15:00', available: false },
          { time: '16:00', available: true },
          { time: '17:00', available: true },
        ],
      },
      {
        date: '2025-01-19',
        timeSlots: [
          { time: '08:00', available: true },
          { time: '09:00', available: true },
          { time: '10:00', available: false },
          { time: '11:00', available: true },
          { time: '13:00', available: false },
          { time: '14:00', available: true },
          { time: '15:00', available: true },
          { time: '16:00', available: false },
          { time: '17:00', available: true },
        ],
      },
    ],
  },
  {
    id: 'showroom-cau-giay',
    name: 'VinFast Showroom Cầu Giấy',
    address: 'Tầng 1, TTTM Grand Plaza, số 148 Trần Duy Hưng, Cầu Giấy',
    district: 'Cầu Giấy',
    city: 'Hà Nội',
    phone: '1900 23 23 86',
    openHours: '08:00 - 21:00',
    availableSlots: [
      {
        date: '2025-01-18',
        timeSlots: [
          { time: '09:00', available: true },
          { time: '10:00', available: true },
          { time: '14:00', available: true },
          { time: '15:00', available: false },
          { time: '16:00', available: true },
        ],
      },
      {
        date: '2025-01-19',
        timeSlots: [
          { time: '09:00', available: false },
          { time: '10:00', available: true },
          { time: '14:00', available: true },
          { time: '15:00', available: true },
          { time: '16:00', available: false },
        ],
      },
    ],
  },
  {
    id: 'showroom-thanh-xuan',
    name: 'VinFast Showroom Thanh Xuân',
    address: 'Số 6 Ngã Tư Sở, quận Thanh Xuân',
    district: 'Thanh Xuân',
    city: 'Hà Nội',
    phone: '1900 23 23 86',
    openHours: '08:00 - 20:00',
    availableSlots: [
      {
        date: '2025-01-18',
        timeSlots: [
          { time: '08:00', available: true },
          { time: '10:00', available: true },
          { time: '14:00', available: false },
          { time: '16:00', available: true },
        ],
      },
      {
        date: '2025-01-19',
        timeSlots: [
          { time: '08:00', available: true },
          { time: '10:00', available: false },
          { time: '14:00', available: true },
          { time: '16:00', available: true },
        ],
      },
    ],
  },
];

export const loanPackages: LoanPackage[] = [
  { bank: 'VPBank', interestRate: 8.5, maxTerm: 84, minDownPayment: 20, description: 'Gói vay ưu đãi VinFast - VPBank' },
  { bank: 'Techcombank', interestRate: 7.99, maxTerm: 96, minDownPayment: 25, description: 'Gói vay linh hoạt Techcombank' },
  { bank: 'VietinBank', interestRate: 8.0, maxTerm: 72, minDownPayment: 30, description: 'Gói vay nhanh VietinBank' },
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function getRecommendedCars(needs: {
  passengers: number;
  monthlyKm: number;
  budgetMonthly?: number;
  budgetTotal?: number;
  usage?: string[];
}): CarModel[] {
  const results = carModels.filter((car) => {
    if (car.seats < needs.passengers) return false;
    if (!car.available) return false;
    const dailyMaxKm = needs.monthlyKm / 30;
    if (car.range < dailyMaxKm * 1.5) return false;
    return true;
  });
  results.sort((a, b) => a.priceOnRoad - b.priceOnRoad);
  if (needs.budgetTotal) {
    const withinBudget = results.filter((car) => car.priceOnRoad <= needs.budgetTotal * 1.2);
    if (withinBudget.length > 0) return withinBudget.slice(0, 3);
  }
  return results.slice(0, 3);
}

export function getCarById(id: string): CarModel | undefined {
  return carModels.find((car) => car.id === id);
}

export function getShowroomById(id: string): Showroom | undefined {
  return showrooms.find((s) => s.id === id);
}
