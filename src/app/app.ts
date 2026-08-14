import { Component, signal,HostListener , OnInit, AfterViewInit} from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Navbar } from './navbar/navbar';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

import { RouterModule } from '@angular/router'; 
// import { ServerService } from './services/server.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HttpClientModule,RouterOutlet,Sidebar,Navbar,FormsModule,CommonModule,RouterModule,ReactiveFormsModule], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public file_path: string = "";
	templateAuthView = false;
  isFullView = false;
 constructor(private router: Router, private route: ActivatedRoute) {}

 ngOnInit(): void {
  const currentUrl = this.router.url;

    if (currentUrl.includes('/login')) {
      if (localStorage.getItem('access_token')) {
        this.router.navigate(['/dashboard'], { replaceUrl: true });
        return;
      }

      this.templateAuthView = true;
      localStorage.clear();
    } else if (localStorage.getItem('access_token')) {
      this.templateAuthView = false;
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
      this.templateAuthView = true;
    }
    
  // this.router.events.pipe( filter(event => event instanceof NavigationEnd)).subscribe((event: any) => {

// Preloader logic on route events
    this.router.events.pipe(
      filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd)
    ).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.showPreloader();
      }

      if (event instanceof NavigationEnd) {
        // Use timeout to allow any animation delay
        setTimeout(() => {
          this.hidePreloader();
        }, 100); // 300ms for smoother UX
      }
    });

 }
toggleFullView(value: boolean) {
  this.isFullView = value;
}
 ngAfterViewInit(): void {
    setTimeout(() => {
      this.hidePreloader();
    }, 150); // Avoid blocking UI on app init
  }


showPreloader(): void {
  const preloader = document.getElementById('preloader');

  if (preloader) {
    preloader.style.display = 'block';
    preloader.style.opacity = '1';
    preloader.style.transition = 'opacity 0.6s ease'; // 'slow' like jQuery

    // Optional: reset body scroll
    document.body.style.overflow = 'hidden';
  }
}

hidePreloader(): void {
  const preloader = document.getElementById('preloader');

  if (preloader) {
    setTimeout(() => {
      preloader.style.opacity = '0'; // start fading
      preloader.style.transition = 'opacity 0.3s ease';

      setTimeout(() => {
        preloader.style.display = 'none';
        document.body.style.overflow = 'visible'; // allow scrolling again
      }, 300); // match the fade-out duration
    }, 350); // delay of 350ms like jQuery's .delay(350)
  }
}

 onActivate(event: any): any {
  const currentUrl = this.router.url;
  this.file_path = currentUrl;

  if (currentUrl.includes('/login')) {
    this.templateAuthView = true;
    localStorage.clear();
    if (localStorage.getItem('access_token')) {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
    return;
  }

  if (localStorage.getItem('access_token')) {
    this.templateAuthView = false;
  } else {
    this.router.navigate(['/login'], { replaceUrl: true });
    this.templateAuthView = true;
  }
}

}
