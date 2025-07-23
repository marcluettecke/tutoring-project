import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router, RouterModule} from "@angular/router";
import {CookieService} from "ngx-cookie-service";
import {AuthService} from "../../services/auth.service";
import {Subject, takeUntil} from "rxjs";
import {AccountsService} from "../../services/accounts.service";
import {NavigationGuardService} from "../../services/navigation-guard.service";
@Component({
             selector: 'app-header',
             standalone: true,
             imports: [RouterModule],
             templateUrl: './header.component.html',
             styleUrls: ['./header.component.scss']
           })
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false
  isAdmin = false
  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService, 
    private router: Router, 
    private cookieService: CookieService, 
    private accountsService: AccountsService,
    private navigationGuard: NavigationGuardService
  ) {
  }

  ngOnInit(): void {
    // Initialize with current auth state
    this.isLoggedIn = !!this.authService.loginChanged.value;
    
    // Double check if we're on login page
    if (this.router.url === '/login') {
      this.isLoggedIn = false;
      this.isAdmin = false;
    }
    
    this.authService.loginChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        // Hide navigation immediately when logged out
        if (!user) {
          this.isAdmin = false;
        }
      });
      
    this.accountsService.isAdmin
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdmin => {
        this.isAdmin = isAdmin;
      });
  }

  logout() {
    this.authService.logOut()
    this.accountsService.resetAdminStatus()
    this.cookieService.delete('loggedinState')
    this.cookieService.delete('adminState')
    this.router.navigate(['login'])
  }

  /**
   * Handle navigation with guard check
   */
  navigateWithGuard(route: string, event: Event): void {
    event.preventDefault();
    
    // Check if user has active session
    const canNavigate = this.navigationGuard.checkActiveSession(route);
    
    if (canNavigate) {
      this.router.navigateByUrl(route);
    }
    // If canNavigate is false, the guard will show the warning modal
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
