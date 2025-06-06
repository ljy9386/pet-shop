// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');   // 비밀번호 해시용
const router = express.Router();
const User = require('../models/User');   // 사용자 모델 연결
const passport = require('passport');     // Passport import

// ================================
// 1) 일반 회원가입
// ================================
router.post('/signup', async (req, res) => {
  console.log('📦 요청받은 데이터 (signup):', req.body);

  try {
    const { user_id, name, email, password, postalCode, address, phone } = req.body;

    if (!user_id || !name || !email || !password || !postalCode || !address || !phone) {
      return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
    }

    // 아이디 중복 확인
    const existingUserId = await User.findOne({ user_id });
    if (existingUserId) {
      console.log('❌ 중복 아이디:', user_id);
      return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
    }

    // 이메일 중복 확인
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('❌ 중복 이메일:', email);
      return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
    }

    // 비밀번호 해시
    const hashed = await bcrypt.hash(password, 10);

    // 새로운 유저 생성
    const newUser = new User({
      user_id,
      name,
      email,
      password: hashed,
      postalCode,
      address,
      phone,
      pet: {
        name: 'none',    // 일반 가입 시에는 pet 정보가 없으므로, 기본값으로 던져두고 나중에 수정할 수 있음
        breed: 'none',
        birth: ''
      }
    });

    await newUser.save();
    console.log('✅ 회원가입 완료:', newUser.user_id);

    // signup 후 즉시 로그인 및 메인페이지로 이동
    return res.send(`
      <script>
        const user = ${JSON.stringify({
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          address: newUser.address,
          phone: newUser.phone,
          postalCode: newUser.postalCode,
          admin: newUser.admin
        })};
        localStorage.setItem("user", JSON.stringify(user));
        if (window.opener) {
          window.opener.location.href = "/index.html";
          window.close();
        } else {
          window.location.href = "/index.html";
        }
      </script>
    `);

  } catch (err) {
    console.error('❌ 회원가입 오류:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// ================================
// 2) 일반 로그인 (Local Strategy)
// ================================
router.post('/login', async (req, res) => {
  console.log('📦 요청받은 데이터 (login):', req.body);
  try {
    const { user_id, password } = req.body;
    if (!user_id || !password) {
      return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
    }

    const user = await User.findOne({ user_id });
    console.log('💡 찾은 유저:', user);
    if (!user) {
      return res.status(400).json({ message: '존재하지 않는 아이디입니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🧪 bcrypt 결과:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 세션 저장
    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone,
      postalCode: user.postalCode,
      admin: user.admin
    };

    // 로그인 후 메인페이지로 이동
    return res.send(`
      <script>
        const user = ${JSON.stringify({
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          address: user.address,
          phone: user.phone,
          postalCode: user.postalCode,
          admin: user.admin
        })};
        localStorage.setItem("user", JSON.stringify(user));
        if (window.opener) {
          window.opener.location.href = "/index.html";
          window.close();
        } else {
          window.location.href = "/index.html";
        }
      </script>
    `);

  } catch (err) {
    console.error('❌ 로그인 오류:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// ================================
// 3) 카카오 로그인
// ================================

// (★ 이전에는 router.get('/auth/kakao', …) 였지만, server.js에서 app.use('/auth', authRouter) 되었으므로
//   여기서는 '/kakao' 로만 선언해야 최종 경로가 '/auth/kakao' 가 됩니다.)
router.get('/kakao', passport.authenticate('kakao'));

router.get(
  '/kakao/callback',
  passport.authenticate('kakao', { failureRedirect: '/login.html', session: true }),
  async (req, res) => {
    // passport.authenticate('kakao')를 통해 req.user가 채워집니다.
    let existingUser = await User.findOne({ user_id: req.user.user_id });
    if (!existingUser) {
      // 신규 회원이면 바로 User를 생성하고, 이후 social-signup이나 다른 페이지로 보낼 수도 있습니다.
      existingUser = await User.create({
        user_id: req.user.user_id,
        name: req.user.displayName,
        email: req.user._json && req.user._json.kakao_account.email,
        password: `social_${Date.now()}`, // 임시 비밀번호
        address: '',
        phone: '',
        postalCode: '',
        pet: { name: '', breed: '', birth: '' }
      });
    }

    // 로그인 성공 후, 클라이언트(LocalStorage)에 user 정보를 저장하고 index.html로 이동
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8" /></head>
        <body>
          <script>
            const user = ${JSON.stringify({
              user_id: existingUser.user_id,
              name: existingUser.name,
              email: existingUser.email,
              address: existingUser.address,
              phone: existingUser.phone,
              postalCode: existingUser.postalCode,
              admin: existingUser.admin || false
            })};
            localStorage.setItem("user", JSON.stringify(user));
            window.location.href = "/index.html";
          </script>
        </body>
      </html>
    `);
  }
);

// ================================
// 4) 네이버 로그인
// ================================
router.get('/naver', passport.authenticate('naver'));

router.get(
  '/naver/callback',
  passport.authenticate('naver', {
    failureRedirect: '/login',
    session: true
  }),
  async (req, res) => {
    const user = req.user;
    console.log('✅ NAVER USER:', user);

    // 세션에 일단 저장
    req.logIn(user, async (err) => {
      if (err) {
        console.error('❌ 세션 저장 실패:', err);
        return res.redirect('/login');
      }

      // DB에 해당 user_id가 있는지 확인
      const existingUser = await User.findOne({ user_id: user.user_id });

      if (!existingUser) {
        // 신규 회원 → 추가정보 입력 페이지로 이동 (localStorage에 탑재)
        req.session.tempUser = user;
        return res.send(`
          <script>
            const socialUser = ${JSON.stringify(user)};
            localStorage.setItem("pendingSocialUser", JSON.stringify(socialUser));
            if (window.opener) {
              window.opener.location.href = "/social-signup.html";
              window.close();
            } else {
              window.location.href = "/social-signup.html";
            }
          </script>
        `);
      }

      // 기존 회원이 있으면 로그인 상태 유지 후 메인으로
      return res.send(`
        <script>
          const userData = ${JSON.stringify({
            user_id: existingUser.user_id,
            name: existingUser.name,
            email: existingUser.email,
            address: existingUser.address,
            phone: existingUser.phone,
            postalCode: existingUser.postalCode,
            admin: existingUser.admin
          })};
          localStorage.setItem("user", JSON.stringify(userData));
          if (window.opener) {
            window.opener.localStorage.setItem("user", JSON.stringify(userData));
            window.opener.location.href = "/index.html";
            window.close();
          } else {
            window.location.href = "/index.html";
          }
        </script>
      `);
    });
  }
);

// ================================
// 5) 구글 로그인
// ================================
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: true
  }),
  async (req, res) => {
    const user = req.user;
    console.log('✅ GOOGLE USER:', user);

    // 세션에 일단 저장
    req.logIn(user, async (err) => {
      if (err) {
        console.error('❌ 세션 저장 실패:', err);
        return res.redirect('/login');
      }

      // DB에 해당 user_id가 있는지 확인
      const existingUser = await User.findOne({ user_id: user.user_id });

      if (!existingUser) {
        // 신규 회원 → 추가정보 입력 페이지로 이동 (localStorage에 탑재)
        req.session.tempUser = user;
        return res.send(`
          <script>
            const socialUser = ${JSON.stringify(user)};
            localStorage.setItem("pendingSocialUser", JSON.stringify(socialUser));
            if (window.opener) {
              window.opener.location.href = "/social-signup.html";
              window.close();
            } else {
              window.location.href = "/social-signup.html";
            }
          </script>
        `);
      }

      // 기존 회원이 있으면 로그인 상태 유지 후 메인으로
      return res.send(`
        <script>
          const userData = ${JSON.stringify({
            user_id: existingUser.user_id,
            name: existingUser.name,
            email: existingUser.email,
            address: existingUser.address,
            phone: existingUser.phone,
            postalCode: existingUser.postalCode,
            admin: existingUser.admin
          })};
          localStorage.setItem("user", JSON.stringify(userData));
          if (window.opener) {
            window.opener.localStorage.setItem("user", JSON.stringify(userData));
            window.opener.location.href = "/index.html";
            window.close();
          } else {
            window.location.href = "/index.html";
          }
        </script>
      `);
    });
  }
);

module.exports = router;
