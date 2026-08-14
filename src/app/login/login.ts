import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Server } from '../server';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import iziToast from 'izitoast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  isLoading = false;
  email = '';
  password = '';
  errorMessage = '';
  preview: string | null = null;
  id: any;
  templateAuthView = true;
  // rememberMe: any;
  showPassword: boolean = false;

  constructor(private router: Router, private serverService: Server, private http: HttpClient) { }
  ngOnInit() {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (token) {
    this.router.navigate(['/dashboard'], { replaceUrl: true });
  }
  this.getBackgroundImg();
}
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  // onSubmit() {
  //   if (this.email === 'demo@example.com' && this.password === 'password123') {
  //     localStorage.setItem('access_token', 'demo-token-123');
  //     this.router.navigate(['/testing'], { replaceUrl: true });
  //   } else {
  //     this.errorMessage = 'Invalid email or password';
  //   }
  // }
    onSubmit() {
    this.isLoading = true;
    const requestData = {
      moduleType: 'login',
      api_type: 'web',
      api_url: 'login', 
      username: this.email,
      password: this.password
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Login Response:', response);

        if (response?.message === 'Login successful') {

          localStorage.setItem('user_id', response.user.id);  
          localStorage.setItem('userCode', response.user.userCode);  
          localStorage.setItem('username', response.user.username); 
          localStorage.setItem('role', response.user.role);  
          localStorage.setItem('roles', JSON.stringify(response.user.roles)); 
          const token = response.token || 'demo-token';
            localStorage.setItem('access_token', token);  
          iziToast.success({
            message: 'Login successful',
            position: 'topRight'
          });
          const roles = response.user.roles;
          if (roles && !roles.includes(101)) {
            this.router.navigate(['/settings'], { replaceUrl: true });
          } else {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          }
        } else {
          
          this.errorMessage = 'Login failed';
          iziToast.error({
            message: 'Invalid email or password',
            position: 'topRight'
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.errorMessage = 'Server error';
        iziToast.error({
          message: 'Server error during login',
          position: 'topRight'
        });
      }
    });
  }

  getBackgroundImg(): void {
  const accessToken = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json'
  });
  
  const url = `https://chettinadlink.cal4care.com/api/getBackgroundImg`;

  this.http.get<any>(url, { headers }).subscribe({
    next: (response) => {
      if (response.status === true && response.data && response.data.image_url) {
        this.preview = response.data.image_url; 
        this.id = response.data.id;
      } else {
        this.preview = null;
        console.error('Error fetching background image:', response);
        iziToast.error({
          message: 'Error fetching background image',
          position: 'topRight',
        });
      }
    },
    error: (err) => {
      console.error('Error fetching background image:', err);
      iziToast.error({
        message: 'Error fetching image',
        position: 'topRight',
      });
    }
  });
}

}
