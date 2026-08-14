import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';
import { ApexChart, ApexPlotOptions, ApexNonAxisChartSeries, ApexTooltip } from 'ng-apexcharts';
import iziToast from 'izitoast';
declare var $: any;
import { Server } from '../server';
interface TankBase {
  name: string;
  capacity: number;
  current: number;
  color: string;
}
// type TankData = TankBase;
// type PurchaseTankData = TankBase;
// type LastMonthTankData = TankBase;
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule, NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard {
  shift = {
    shiftDate: '',
    shiftNo: '',
    openingTime: '',
    closingTime: '',
    entries: [{ pump: '', nozzle: '', fuelType: 'Petrol', opening: 0, closing: 0, sales: 0, operatorName: '' }],
    paymentModes: {
      cash: 0,
      card: 0,
      upi: 0,
      credit: 0
    },
    expenses: [{ description: '', amount: 0 }],
    comments: ''
  };
  isLoading = false;
  dashboardDatas: any[] = [];
  totalPriceMS: any;
  totalPriceHSD: any;
  totalStaff: any;
  totalCustomers: any;
  selectedDate: string = '';
  viewData: any = {};
  fromDate: string = '';
  toDate: string = '';
  hint: string = '';
  yesPriceMS: any;
  yesPriceHSD: any;
  yesCash: any;
  yesSwipping: any;
  yesGpay: any;
  yesOilSales: any;
  yesPhonepe: any;
  chartOptions1: any;
  chartOptions2: any;
  yesLiterMS: any;
  yesLiterHSD: any;
  yesDigitalTotal: any;
  selectDate: any;
  ev_total: any;
  oilEvTotal: any;
  cards: any[] = [];
  tanks: any[] = [];
  purchasetanks: any[] = [];
  lastmonthtanks: any[] = [];
  today = new Date();
  yescoins: any;
  ms_total_sales: any;
  hsd_total_sales: any;
  digital_total: any;
  mon_hsd_total_sales: any;
  mon_ms_total_sales: any;
  mon_digital_total: any;
  shiftA_hsd_total_sales: any;
  shiftA_ms_total_sales: any;
  shiftA_digital_total: any;
  oil_sales_total: any;
  mon_oil_sales_total: any;
  shiftA_oil_sales_total: any;
  shiftB_hsd_total_sales: any;
  shiftB_ms_total_sales: any;
  shiftB_digital_total: any;
  shiftB_oil_sales_total: any;
  isMobile: boolean = false;
  yesCreditLiterMS: any;
  yesCredittoatMS: any;
  yesCreditLiterHSD: any;
  yesCredittoatHSD: any;
  yesCreditDigitalTotal: any;
  yesDiscountTotal: any;
  purchase_ms_liters: any;
  closing_ms_liters: any;
  purchase_hsd_liters: any;
  closing_hsd_liters: any;
  cur_purchase_ms_liters: any;
  cur_closing_ms_liters: any;
  cur_purchase_hsd_liters: any;
  cur_closing_hsd_liters: any;
  ms_last_reading_liters: any;
  ms_last_purchase_liters: any;
  hsd_last_reading_liters: any;
  hsd_last_purchase_liters: any;
  constructor(private serverService: Server, private router: Router) {
    this.checkIfMobile();
  }
  ngOnInit() {

    const today = new Date();
    const ddMMyyyy = today.toISOString().split('T')[0];
    this.selectDate = ddMMyyyy;

    this.getDashboardData();
    this.chartFunction();
  }
  // tanks: TankData[] = [
  //   { name: 'MS', capacity: 25000, current: 15000, color: '#008FFB' },
  //   { name: 'HSD', capacity: 30000, current: 20900, color: '#FF10F0' },
  // ];
  // purchasetanks: PurchaseTankData[] = [
  //   { name: 'MS', capacity: 10000, current: 10000, color: '#008FFB' },
  //   { name: 'HSD', capacity: 10000, current: 6000, color: '#FF10F0' },
  // ];
  // lastmonthtanks: LastMonthTankData[] = [
  //   { name: 'MS', capacity: 25000, current: 10000 + 15000, color: '#008FFB' },
  //   { name: 'HSD', capacity: 35000, current: 20000 + 15000, color: '#FF10F0' }
  // ];


  chart: ApexChart = {
    type: 'radialBar',
    height: 250
  };

  plotOptions: ApexPlotOptions = {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: { size: '60%' },
      dataLabels: {
        name: { show: true, fontSize: '14px', offsetY: 30 },
        value: {
          fontSize: '18px',
          offsetY: -10,
          formatter: (val: number) => `${val}%`

        }
      }
    }
  };

  getTooltip(data: TankBase[]): ApexTooltip {
    return {
      y: {
        formatter: (_val, opts) => {
          const tank = data[opts.seriesIndex];
          return tank ? `${tank.current} / ${tank.capacity} Liters` : '';
        }
      }
    };
  }
  parseKL(value: any): number {
    if (!value) return 0;
    if (typeof value === 'string') {
      // return parseFloat(value.replace(/[^0-9.]/g, '')) * 1000; 
      return parseFloat(value.replace(/[^0-9.]/g, ''));
    }
    return value;
  }
  // toNumber(value: string): number {
  //   if (!value) return 0;
  //   return parseFloat(value.replace(/[^0-9.]/g, ''));
  // }
  toNumber(value: string): number {
  if (!value) return 0;
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  return value.toLowerCase().includes('kl') ? num * 1000 : num;
}
  // getSeries(current: number, capacity: number): ApexNonAxisChartSeries {
  //   if (!capacity || capacity === 0) {
  //     return [0];
  //   }
  //   return [Math.round((current / capacity) * 100)];
  // }
  getSeries(current: number, capacity: number): ApexNonAxisChartSeries {
  if (!capacity || capacity === 0) {
    return [0];
  }
  const percent = Math.round((current / capacity) * 100);
  return [Math.min(percent, 100)];
}
  addRow() {
    this.shift.entries.push({ pump: '', nozzle: '', fuelType: 'Petrol', opening: 0, closing: 0, sales: 0, operatorName: '' });
  }

  removeRow(index: number) {
    this.shift.entries.splice(index, 1);
    this.updateTotalSales();
  }

  updateSales(index: number) {
    const entry = this.shift.entries[index];
    entry.sales = Math.max(0, entry.closing - entry.opening);
    this.updateTotalSales();
  }

  updateTotalSales() {
    this.shift.entries.forEach(entry => entry.sales = Math.max(0, entry.closing - entry.opening));
  }

  get totalSales() {
    return this.shift.entries.reduce((acc, entry) => acc + entry.sales, 0);
  }

  getDashboardData() {
    const user_id = localStorage.getItem('user_id');
    this.isLoading = true;
    const requestData = {
      api_url: `getDashboardList?selected_date=${this.selectDate}&user_id=${user_id}`,
    }

    this.serverService.sendServerGet(requestData).subscribe({
      next: (response: any) => {

        if (response.status === true || response.status === 'true') {

          this.dashboardDatas = response.data;

          this.ms_total_sales = response.data.date_range.ms_total_sales;
          this.hsd_total_sales = response.data.date_range.hsd_total_sales;
          this.digital_total = response.data.date_range.digital_total;
          this.oil_sales_total = response.data.date_range.oil_sales_total;
          this.mon_hsd_total_sales = response.data.monthly.hsd_total_sales;
          this.mon_ms_total_sales = response.data.monthly.ms_total_sales;
          this.mon_digital_total = response.data.monthly.digital_total;
          this.mon_oil_sales_total = response.data.monthly.oil_sales_total;
          this.shiftA_hsd_total_sales = response.data.today_shifts.shift_a.hsd_total_sales;
          this.shiftA_ms_total_sales = response.data.today_shifts.shift_a.ms_total_sales;
          this.shiftA_digital_total = response.data.today_shifts.shift_a.digital_total;
          this.shiftA_oil_sales_total = response.data.today_shifts.shift_a.oil_sales_total;
          this.shiftB_hsd_total_sales = response.data.today_shifts.shift_b.hsd_total_sales;
          this.shiftB_ms_total_sales = response.data.today_shifts.shift_b.ms_total_sales;
          this.shiftB_digital_total = response.data.today_shifts.shift_b.digital_total;
          this.shiftB_oil_sales_total = response.data.today_shifts.shift_b.oil_sales_total;

          this.totalStaff = response.data.total_staff;
          this.totalCustomers = response.data.totalCustomers;

          this.yesLiterMS = response.data.yesterday.ms_total_sales;
          this.yesPriceMS = response.data.yesterday.ms_fuel_total;
          this.totalPriceMS = response.data.today_price_ms;
          this.yesCreditLiterMS = response.data.yesterday.credit_ms_liters;
          this.yesCredittoatMS = response.data.yesterday.credit_ms_total;

          this.yesLiterHSD = response.data.yesterday.hsd_total_sales;
          this.yesPriceHSD = response.data.yesterday.hsd_fuel_total;
          this.totalPriceHSD = response.data.today_price_hsd;
          this.yesCreditLiterHSD = response.data.yesterday.credit_hsd_liters;
          this.yesCredittoatHSD = response.data.yesterday.credit_hsd_total;

          this.yescoins = response.data.yesterday.coins_total;
          this.yesCash = response.data.yesterday.cash_total;
          this.yesGpay = response.data.yesterday.gpay_total;
          this.yesPhonepe = response.data.yesterday.phonepe_total;
          this.yesSwipping = response.data.yesterday.swipping_total;
          this.yesDigitalTotal = response.data.yesterday.digital_total;
          this.yesDiscountTotal = response.data.yesterday.discount;
          this.yesCreditDigitalTotal = response.data.yesterday.credit_total;

          this.yesOilSales = response.data.yesterday.oil_sales_total;
          this.ev_total = response.data.yesterday.ev_total;
          this.oilEvTotal = response.data.yesterday.oilEvtotal;

          
          this.purchase_ms_liters = response.data.purchaseDashboard.purchase_vs_closing_from_29.purchase_ms_liters
          this.closing_ms_liters = response.data.purchaseDashboard.purchase_vs_closing_from_29.closing_ms_liters
          this.purchase_hsd_liters = response.data.purchaseDashboard.purchase_vs_closing_from_29.purchase_hsd_liters
          this.closing_hsd_liters = response.data.purchaseDashboard.purchase_vs_closing_from_29.closing_hsd_liters

          this.ms_last_reading_liters = response.data.purchaseDashboard.last_purchase_and_reading.ms_last_reading_liters
          this.ms_last_purchase_liters = response.data.purchaseDashboard.last_purchase_and_reading.ms_last_purchase_liters
          this.hsd_last_reading_liters = response.data.purchaseDashboard.last_purchase_and_reading.hsd_last_reading_liters
          this.hsd_last_purchase_liters = response.data.purchaseDashboard.last_purchase_and_reading.hsd_last_purchase_liters

          this.cur_purchase_ms_liters = response.data.purchaseDashboard.current_month_purchase_vs_closing.purchase_ms_liters
          this.cur_closing_ms_liters = response.data.purchaseDashboard.current_month_purchase_vs_closing.closing_ms_liters
          this.cur_purchase_hsd_liters = response.data.purchaseDashboard.current_month_purchase_vs_closing.purchase_hsd_liters
          this.cur_closing_hsd_liters = response.data.purchaseDashboard.current_month_purchase_vs_closing.closing_hsd_liters
          this.tanks = [
            {
              name: 'MS',
              capacityNum: this.toNumber(this.purchase_ms_liters),
              currentNum: this.toNumber(this.closing_ms_liters),
              capacityLabel: this.purchase_ms_liters,
              currentLabel: this.closing_ms_liters,
              color: '#008FFB'
            },
            {
              name: 'HSD',
              capacityNum: this.toNumber(this.purchase_hsd_liters),
              currentNum: this.toNumber(this.closing_hsd_liters),
              capacityLabel: this.purchase_hsd_liters,
              currentLabel: this.closing_hsd_liters,
              color: '#FF10F0'
            }
          ];
          this.purchasetanks = [
            {
              name: 'MS',
              capacityNum: this.toNumber(this.ms_last_purchase_liters),
              currentNum: this.toNumber(this.ms_last_reading_liters),
              capacityLabel: this.ms_last_purchase_liters,
              currentLabel: this.ms_last_reading_liters,
              color: '#008FFB'
            },
            {
              name: 'HSD',
              capacityNum: this.toNumber(this.hsd_last_purchase_liters),
              currentNum: this.toNumber(this.hsd_last_reading_liters),
              capacityLabel: this.hsd_last_purchase_liters,
              currentLabel: this.hsd_last_reading_liters,
              color: '#FF10F0'
            }
          ];
          this.lastmonthtanks = [
            {
              name: 'MS',
              capacityNum: this.toNumber(this.cur_purchase_ms_liters),
              currentNum: this.toNumber(this.cur_closing_ms_liters),
              capacityLabel: this.cur_purchase_ms_liters,
              currentLabel: this.cur_closing_ms_liters,
              color: '#008FFB'
            },
            {
              name: 'HSD',
              capacityNum: this.toNumber(this.cur_purchase_hsd_liters),
              currentNum: this.toNumber(this.cur_closing_hsd_liters),
              capacityLabel: this.cur_purchase_hsd_liters,
              currentLabel: this.cur_closing_hsd_liters,
              color: '#FF10F0'
            }
          ];
          // ✅ Build cards array dynamically
          this.cards = [
            {
              title: 'MS Sales',
              icon: 'fas fa-gas-pump',
              color: 'green',
              main: { label: 'Yesterday Sales', value: this.yesPriceMS, unit: '₹' },
              sub_main: [
                { label: '29 Aug 2025 Onwards', value: this.ms_total_sales, unit: 'Ltr' },
                { label: 'This Month Sales', value: this.mon_ms_total_sales, unit: 'Ltr' },
                { label: 'Today Shift A', value: this.shiftA_ms_total_sales, unit: 'Ltr' },
                { label: 'Today Shift B', value: this.shiftB_ms_total_sales, unit: 'Ltr' },
              ],
              subs: [
                { label: 'Liters', value: this.yesLiterMS, unit: 'Ltr' },
                { label: 'Today Price', value: this.totalPriceMS, unit: '₹' },
                { label: 'Credit Liters', value: this.yesCreditLiterMS, unit: 'Ltr' },
                { label: 'Credit Total', value: this.yesCredittoatMS, unit: '₹' }
              ],
              flipped: false,
            },
            {
              title: 'HSD Sales',
              icon: 'fas fa-gas-pump',
              color: 'red',
              main: { label: 'Yesterday Sales', value: this.yesPriceHSD, unit: '₹' },
              sub_main: [
                { label: '29 Aug 2025 Onwards', value: this.hsd_total_sales, unit: 'Ltr' },
                { label: 'This Month Sales', value: this.mon_hsd_total_sales, unit: 'Ltr' },
                { label: 'Today Shift A', value: this.shiftA_hsd_total_sales, unit: 'Ltr' },
                { label: 'Shift Entry B', value: this.shiftB_hsd_total_sales, unit: 'Ltr' },
              ],
              subs: [
                { label: 'Liters', value: this.yesLiterHSD, unit: 'Ltr' },
                { label: 'Today Price', value: this.totalPriceHSD, unit: '₹' },
                { label: 'Credit Liters', value: this.yesCreditLiterHSD, unit: 'Ltr' },
                { label: 'Credit Total', value: this.yesCredittoatHSD, unit: '₹' }
              ],
              flipped: false,
            },
            {
              title: 'Collections',
              icon: 'fas fa-wallet',
              color: 'blue',
              main: { label: 'Total Digital', value: this.yesDigitalTotal, unit: '₹' },
              sub_main: [
                { label: '29 Aug 2025 Onwards', value: this.digital_total, unit: '₹' },
                { label: 'This Month Collections', value: this.mon_digital_total, unit: '₹' },
                { label: 'Today Shift A', value: this.shiftA_digital_total, unit: '₹' },
                { label: 'Today Shift B', value: this.shiftB_digital_total, unit: '₹' },
              ],
              subs: [
                { label: 'Cash', value: this.yesCash, unit: '₹' },
                { label: 'Coin', value: this.yescoins, unit: '₹' },
                { label: 'GPay', value: this.yesGpay, unit: '₹' },
                { label: 'PhonePe', value: this.yesPhonepe, unit: '₹' },
                { label: 'Swipping', value: this.yesSwipping, unit: '₹' },
                { label: 'Credit Total', value: this.yesCreditDigitalTotal, unit: '₹' },
                { label: 'Discount Total', value: this.yesDiscountTotal, unit: '₹' }
              ],
              flipped: false,
            },
            {
              title: 'Oil & EV Sales',
              icon: 'fas fa-industry',
              color: 'orange',
              main: { label: 'Oil + EV', value: this.oilEvTotal, unit: '₹' },
              sub_main: [
                { label: '29 Aug 2025 Onwards', value: this.oil_sales_total, unit: '₹' },
                { label: 'This Month Sales', value: this.mon_oil_sales_total, unit: '₹' },
                { label: 'Today Shift A', value: this.shiftA_oil_sales_total, unit: '₹' },
                { label: 'Today Shift B', value: this.shiftB_oil_sales_total, unit: '₹' },
              ],
              subs: [
                { label: 'Oil', value: this.yesOilSales, unit: '₹' },
                { label: 'EV', value: this.ev_total, unit: '₹' }
              ],
              flipped: false,
            }
          ];

          this.isLoading = false;

        }
      },
      error: (err: any) => {
        console.error(err);

        this.isLoading = false;

      }
    })

  }
  @HostListener('window:resize')
  onResize() {
    this.checkIfMobile();
  }
  checkIfMobile() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 1024;

    // If we just switched from mobile to desktop
    if (wasMobile && !this.isMobile) {
      // Reset all flipped cards
      this.cards.forEach(card => card.flipped = false);
    }
  }
  toggleFlip(card: any, event: Event) {
    if (!this.isMobile) {
      // Prevent flip by click on desktop
      return;
    }
    card.flipped = !card.flipped;
    // Prevent hover flipping when clicked on mobile
    event.stopPropagation();
  }
   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
  filterByDate1() {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');
    if (!this.fromDate) {
      this.isLoading = false;

      iziToast.error({
        title: 'Error',
        message: 'Please select a date before filtering.',
        position: 'topRight'
      });

      return;
    }
    //const formattedDate = this.selectedDate;
    const requestData = {
      moduleType: 'shift_entry',
      api_type: 'api',
      api_url: 'shiftSummary',
      user_id: user_id,
      from_date: this.fromDate,
      to_date: this.toDate
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.isLoading = false;
          this.hint = response.hint;
          const summary = response.summary;

          let fuel_list: any[] = [];
          let total_summary: any[] = [];

          if (Array.isArray(summary.fuel_summary)) {
            // console.log('🚀 Shift-wise summary detected');

            fuel_list = summary.fuel_summary.flatMap((shift: any) =>
              ['MS', 'HSD'].flatMap(fuelType =>
                shift.pumps.map((pump: any) => {
                  const fuel = pump[fuelType][0];
                  return {
                    fuel_type: fuelType,
                    shift: shift.shift,
                    pump_no: pump.pump_no,
                    opening: fuel.opening_reading,
                    closing: fuel.closing_reading,
                    sales_qty: fuel.total_sales,
                    price: fuel.price,
                    test_liters: fuel.test_liters,
                    test_amount: fuel.test_amount,
                    total: fuel.total_amount,
                  };
                })
              )
            );
            // console.log('✅ fuel_list:', fuel_list);
          } else {
            // console.log('📊 Using totals directly');
            const fuelSummary = summary.fuel_summary;
            fuel_list = ['MS', 'HSD'].map(fuelType => {
              const fuel = fuelSummary[fuelType];
              return {
                fuel_type: fuelType,
                shift: '-',
                pump_no: '-',
                opening: fuel.opening_reading,
                closing: fuel.closing_reading,
                sales_qty: fuel.total_sales,
                price: fuel.price,
                test_liters: fuel.test_liters,
                test_amount: fuel.test_amount,
                total: fuel.total_amount,

              };

            });
          }

          // console.log('Fuel List:', this.viewData?.fuel_list);
          const table = $('#datatable').DataTable();
          table.destroy();

          setTimeout(() => {
            $('#datatable').DataTable();
          }, 0);
          this.viewData = {
            shift_date: response.date,
            // pump_no: '1', 
            // shift: 'A',   


            // nozzle: summary.fuel_list[0]?.fuel_type,
            // opening_reading: summary.fuel_list[0]?.opening,
            // closing_reading: summary.fuel_list[0]?.closing,
            // total_sales: summary.fuel_list[0]?.sales_qty,
            // price: summary.fuel_list[0]?.price,
            // total: summary.fuel_list[0]?.total,
            // fuel_list: summary.fuel_list,

            fuel_list: fuel_list,
            coins: summary.coins_total,
            coins_denom: summary.coin_denominations,

            gpay: summary.gpay_total,
            phonepe: summary.phonepe_total,
            swipping: summary.swipping_total,
            cash: summary.cash_total,
            cash_denom: summary.cash_denominations,
            customer_credits: summary.customer_credits,
            credit: summary.credit_total,
            payment_total: summary.payment_total,
            receipt: summary.receipt_total,
            grand_total_1: summary.grand_total_1,

            shift_fuel_total: summary.fuel_sales_total,
            test: summary.test_fuel,
            oil_sale: summary.oil_sales_total,
            product_entry: summary.oil_products,
            ev_total: summary.ev_total,
            ev_entry: summary.ev_summary,
            discount: summary.discount,
            extra_fuel: summary.extra_fuel,
            grand_total_2: summary.grand_total_2,
            difference: summary.difference_total,
            manual_difference: summary.manual_difference_total
          };
          $('#viewModal').modal('show');
          this.isLoading = false;
          this.fromDate = '';
          this.toDate = '';
        } else {
          iziToast.warning({
            title: 'No Data',
            message: 'No summary data found for the selected date.',
            position: 'topRight'
          });
          this.isLoading = false;
          this.fromDate = '';
          this.toDate = '';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ View API error', err);
      }
    });
  }
  filterByDate() {
    this.isLoading = true;
    const user_id = localStorage.getItem('user_id');

    if (!this.fromDate) {
      this.isLoading = false;
      iziToast.error({
        title: 'Error',
        message: 'Please select a date before filtering.',
        position: 'topRight'
      });
      return;
    }

    const requestData = {
      moduleType: 'shift_entry',
      api_type: 'api',
      api_url: 'shiftSummary',
      user_id,
      from_date: this.fromDate,
      to_date: this.toDate
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        if (response.status) {
          const summary = response.summary;
          let fuel_list: any[] = [];

          if (Array.isArray(summary.fuel_summary)) {
            // 🚀 Case 1: Check if it’s shift-wise (shift + pumps)
            if (summary.fuel_summary.length && summary.fuel_summary[0].pumps) {
              fuel_list = summary.fuel_summary.flatMap((shift: any) =>
                shift.pumps.flatMap((pump: any) =>
                  ['MS', 'HSD'].map(fuelType => {
                    const fuel = pump[fuelType][0];
                    return {
                      shift: shift.shift,
                      pump_no: pump.pump_no,
                      fuel_type: fuelType,
                      opening: fuel.opening_reading,
                      closing: fuel.closing_reading,
                      sales_qty: fuel.total_sales,
                      test_liters: fuel.test_liters,
                      test_amount: fuel.test_amount,
                      total: fuel.total_amount

                    };
                  })
                )
              );

            } else {
              // 🚀 Case 2: Pump-wise (no shift, just pumps array)
              fuel_list = summary.fuel_summary.flatMap((pump: any) =>
                ['MS', 'HSD'].flatMap(fuelType => {
                  const fuels = pump[fuelType] || [];
                  return fuels.map((fuel: any) => ({
                    shift: '-',
                    pump_no: pump.pump_no,
                    fuel_type: fuelType,
                    opening: fuel.opening_reading,
                    closing: fuel.closing_reading,
                    sales_qty: fuel.total_sales,
                    test_liters: fuel.test_liters,
                    test_amount: fuel.test_amount,
                    total: fuel.total_amount
                  }));
                })
              );
            }

          } else {
            // 🚀 Case 3: Totals only (single object with MS/HSD)
            fuel_list = ['MS', 'HSD'].map(fuelType => {
              const fuel = summary.fuel_summary[fuelType];
              return {
                shift: '-',
                pump_no: '-',
                fuel_type: fuelType,
                opening: fuel.opening_reading,
                closing: fuel.closing_reading,
                sales_qty: fuel.total_sales,
                test_liters: fuel.test_liters,
                test_amount: fuel.test_amount,
                total: fuel.total_amount
              };
            });
          }
          const normalize = (data: any) =>
            Array.isArray(data) ? data : (data ? Object.values(data) : []);
          this.viewData = {
            shift_date: response.date,
            fuel_list,
            coins: summary.coins_total ?? 0,
            gpay: summary.gpay_total ?? 0,
            cash: summary.cash_total ?? 0,
            coins_denom: normalize(summary.coin_denominations),
            phonepe: summary.phonepe_total ?? 0,
            swipping: summary.swipping_total ?? 0,
            cash_denom: normalize(summary.cash_denominations),
            customer_credits: normalize(summary.customer_credits),
            credit: summary.credit_total ?? 0,
            payment_total: summary.payment_total ?? 0,
            receipt: summary.receipt_total ?? 0,
            grand_total_1: summary.grand_total_1 ?? 0,

            shift_fuel_total: summary.fuel_sales_total ?? 0,
            test: summary.test_fuel ?? 0,
            oil_sale: summary.oil_sales_total ?? 0,
            product_entry: normalize(summary.oil_products),
            ev_total: summary.ev_total ?? 0,
            ev_entry: normalize(summary.ev_summary),
            discount: summary.discount ?? 0,
            extra_fuel: summary.extra_fuel ?? 0,
            grand_total_2: summary.grand_total_2 ?? 0,
            difference: summary.difference_total ?? 0,
            manual_difference: summary.manual_difference_total ?? 0,
          };

          this.hint = response.hint; // 👈 very important
          this.isLoading = false;
          $('#viewModal').modal('show');
          this.fromDate = '';
          this.toDate = '';
        } else {
          iziToast.warning({
            title: 'No Data',
            message: 'No summary data found.',
            position: 'topRight'
          });
          this.isLoading = false;
          this.fromDate = '';
          this.toDate = '';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ API error', err);
        this.fromDate = '';
        this.toDate = '';
      }
    });
  }


  closeModal(): void {
    $('#viewModal').modal('hide');
  }

  chartFunction() {
    this.chartOptions1 = {
      series: [{ name: 'Sales', data: [172, 189, 201, 240, 166, 196, 218, 167, 175, 152, 156, 164] }],
      chart: { type: 'bar', height: 300, zoom: { enabled: false }, toolbar: { show: false } },
      title: { text: 'Monthly Sales Data' },
      xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
      dataLabels: { enabled: false }
    };

    this.chartOptions2 = {
      series: [{ name: 'Profit', data: [90, 120, 140, 180, 160, 210, 190, 175, 200, 220, 205, 230] }],
      chart: { type: 'line', height: 300, zoom: { enabled: false }, toolbar: { show: false } },
      title: { text: 'Profit Trend' },
      xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
      stroke: { curve: 'smooth' },
      dataLabels: { enabled: false }
    };
  }


}

