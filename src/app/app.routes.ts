import { Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { IssueComponent } from './issue/issue.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ItemMasterComponent } from './item-master/item-master.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'signIn',
    component: SignInComponent,
  },
  {
    path: 'issue',
    component: IssueComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'signUp',
    component: SignUpComponent
  },
  
  {
    path: 'itemMaster',
    component: ItemMasterComponent
  },

  {
    path: '404',
    component: NotFoundComponent,
  },
  {
    path: '**',
    redirectTo: '404',
  },

  // {
  //   path: '**',
  //   redirectTo: '',
  // },
];
