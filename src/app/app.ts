import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MainMenu } from './components/main-menu/main-menu';
import { LoginService } from './services/login/login-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [MainMenu, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {

  private loginService = inject(LoginService);
  protected user = this.loginService.user;

}
