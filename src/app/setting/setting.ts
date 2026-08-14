import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Server } from '../server';
import { HttpClient } from '@angular/common/http';
import {MatTooltipModule} from '@angular/material/tooltip';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import iziToast from 'izitoast';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule,MatTooltipModule],
  templateUrl: './setting.html',
  styleUrls: ['./setting.css']
})
export class Setting {
  files: any;
  preview: string | null = null;
  loginbannerForm!: FormGroup;
  httpClient: any;
  id: any;
  role: string | null = null;
  selectedUser: any;
  constructor(private serverService: Server, private fb: FormBuilder, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.role = localStorage.getItem('role');
    this.loginbannerForm = this.fb.group({
      login_banner: ['', Validators.required],
    });
    this.getBackgroundImg();
    this.getUser();
  }

   home() {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (roles && !roles.includes(101)) {
      this.router.navigate(['/settings'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
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


  // Handler for file change event
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file instanceof File) {
        this.preview = URL.createObjectURL(file);
        this.files = file;
        this.loginbannerForm.get('login_banner')?.markAsTouched();
      } else {
        console.error("Selected file is not of type 'File'");
      }
    }
  }


  viewImage(src: string): void {
    window.open(src, '_blank');
  }

  async updateBanner() {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) {
      console.error('User ID not found!');
      return;
    }

    const formData = new FormData();
    if (this.files) {
      formData.append('image', this.files, this.files.name);
    } else {
      console.error('No file selected');
      return;
    }
    formData.append('user_id', user_id);
    formData.append('id', this.id);

    Swal.fire({ title: 'Please wait...', allowOutsideClick: false });
    Swal.showLoading();
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch('https://chettinadlink.cal4care.com/api/uploadBackgroundImg', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const result = await response.json();
      Swal.close();

      if (result.status === true) {
        iziToast.success({
          message: 'File uploaded successfully!',
          position: 'topRight',
        });
      } else {
        console.error('Server Error:', result);
        iziToast.error({
          message: result.message || 'Error uploading',
          position: 'topRight',
        });
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      Swal.close();
      iziToast.error({
        message: 'Network error occurred',
        position: 'topRight',
      });
    }
  }

  getUser(): void {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.warn('No user_id found in localStorage.');
      return;
    }

    const requestData = {
      moduleType: 'user',
      api_type: 'api',
      api_url: 'userEdit',
      user_id: userId,
      id: userId
    };

    this.serverService.sendServer(requestData).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          this.selectedUser = response.data; // Use the user data here
          console.log('User fetched:', this.selectedUser);
        } else {
          console.warn('No user data found in response.');
        }
      },
      error: (err) => {
        console.error('Failed to fetch user data:', err);
      }
    });
  }



}
