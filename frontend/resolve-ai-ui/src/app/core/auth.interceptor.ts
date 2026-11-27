import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { config } from './config';

export const authInterceptor: HttpInterceptorFn =
    (req, next) => {

        if (!req.url.startsWith(`${config.apiUrl}/`)) {
            return next(req);
        }

        const auth = inject(AuthService);

        return from(auth.getSession()).pipe(

            switchMap(session => {

                if (!session?.access_token) {
                    return next(req);
                }

                const authenticatedRequest = req.clone({
                    setHeaders: {
                        Authorization:
                            `Bearer ${session.access_token}`
                    }
                });

                return next(authenticatedRequest);
            })
        );
    };