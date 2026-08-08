import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import UserRepository from "../repositories/UserRepository";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/v1/auth/oauth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value || "";
          let user = await UserRepository.findByOAuthId(profile.id);
          
          if (!user && email) {
             user = await UserRepository.findByEmail(email);
          }

          if (!user) {
            user = await UserRepository.create({
              email,
              firstName: profile.name?.givenName || profile.displayName || "",
              lastName: profile.name?.familyName || "",
              authProvider: "google",
              oauthId: profile.id,
              isEmailVerified: true, // OAuth providers verify emails
              profileSetup: true,
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/v1/auth/oauth/github/callback",
        scope: ["user:email"],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0].value || "";
          let user = await UserRepository.findByOAuthId(profile.id);
          
          if (!user && email) {
             user = await UserRepository.findByEmail(email);
          }

          if (!user) {
            user = await UserRepository.create({
              email,
              firstName: profile.displayName || profile.username || "",
              lastName: "",
              authProvider: "github",
              oauthId: profile.id,
              isEmailVerified: true,
              profileSetup: true,
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

export default passport;
