// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs'); // 비밀번호 해시용
const router = express.Router();
const User = require('../models/User'); // ✅ 사용자 모델 연결 (경로는 실제 파일에 맞게 수정)
const passport = require('passport'); // ← 이거 추가해야 정상 작동


// 회원가입라우터

router.post('/signup', async (req, res) => {
  console.log('📦 요청받은 데이터:', req.body);

  try {
    const { user_id, name, email, password, postalCode, address, phone } = req.body;

    if (!user_id || !name || !email || !password || !postalCode || !address || !phone) {
      return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('❌ 중복 이메일:', email);
      return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
    }

    const existingUserId = await User.findOne({ user_id });
    if (existingUserId) {
      console.log('❌ 중복 아이디:', user_id);
      return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      user_id,
      name,
      email,
      password: hashed,
      postalCode,
      address,
      phone,
    });

    await newUser.save();
    console.log('✅ 회원가입 성공:', user_id);
    res.status(201).json({ message: '회원가입 성공!' });

  } catch (err) {
    console.error('❌ 회원가입 에러:', err.message); // 🔥 에러 메시지만 추출
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});


// routes/auth.js 로그인정보 라우터

router.post('/login', async (req, res) => {
  const { user_id, password } = req.body;
  console.log('📥 로그인 시도:', user_id);

  let user;

  try {
    user = await User.findOne({ user_id });
    console.log("💡 찾은 유저:", user);
    if (!user) {
      return res.status(400).json({ message: '존재하지 않는 아이디입니다.' });
    }
    console.log("👉 입력 비번:", password);
    console.log("👉 입력 비번 타입:", typeof password);
    console.log("👉 DB 비번:", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🧪 bcrypt 결과:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    req.session.user = {
      user_id: user.user_id,
      name: user.name
    };

    console.log('✅ 로그인 성공:', user.user_id);

    // ✅ 프론트에서 localStorage.setItem 위해 user 정보 포함 응답
    return res.status(200).json({
      message: '로그인 성공!',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        postalCode: user.postalCode,
        address: user.address,
        phone: user.phone,
        admin: user.admin
      }
    });
  } catch (err) {
    console.error('❌ 로그인 에러:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});



// 회원정보 수정 라우터

router.post('/user/update', async (req, res) => {
  try {
    const { user_id, phone, address, postalCode, password } = req.body;

    const updateData = { phone, address, postalCode };

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    const updated = await User.findOneAndUpdate({ user_id }, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });

    console.log('✅ 회원정보 수정 완료:', user_id);
    return res.json({ message: '수정 성공' });
  } catch (err) {
    console.error('❌ 회원정보 수정 오류:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// 카카오 로그인 진입
router.get('/kakao', passport.authenticate('kakao'));

// 로그인 성공 후 콜백
router.get('/kakao/callback',
  passport.authenticate('kakao', {
    failureRedirect: '/login.html',
  }),
  (req, res) => {
    // 로그인 성공 후 메인 페이지로 이동
    res.redirect('/');
  }
);

// 네이버 로그인 시작
router.get('/naver', passport.authenticate('naver'));

// 네이버 콜백
router.get('/naver/callback',
  passport.authenticate('naver', {
    failureRedirect: '/login',
    session: true
  }),
  async (req, res) => {
    const user = req.user;
    console.log("✅ NAVER USER:", user);

    // ✅ 세션 저장
    req.logIn(user, async (err) => {
      if (err) {
        console.error("❌ 세션 저장 실패:", err);
        return res.redirect('/login');
      }

      // ✅ DB 확인
      const existingUser = await User.findOne({ user_id: user.user_id });

      if (!existingUser) {
        // 신규 유저: 추가정보 입력용 세션 저장
        req.session.tempUser = user;

        // ✅ 팝업 안에서 메인창 이동 + 팝업 닫기
        return res.send(`
          <script>
            if (window.opener) {
              window.opener.location.href = "/social-signup.html";
              window.close();
            } else {
              window.location.href = "/social-signup.html";
            }
          </script>
        `);
      }

      // 기존 회원: 바로 메인으로 이동
      return res.send(`
  <script>
    const user = ${JSON.stringify(user)};
    localStorage.setItem("user", JSON.stringify(user));

    if (window.opener) {
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

// 구글 로그인 시작
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 구글 로그인 콜백
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: true
  }),
  async (req, res) => {
    const user = req.user;
    console.log("✅ GOOGLE USER:", user);

    req.logIn(user, async (err) => {
      if (err) {
        console.error("❌ 구글 세션 저장 실패:", err);
        return res.redirect('/login');
      }

      const existingUser = await User.findOne({ user_id: user.user_id });

      if (!existingUser) {
        req.session.tempUser = user;
        return res.send(`
          <script>
            if (window.opener) {
              window.opener.location.href = "/social-signup.html";
              window.close();
            } else {
              window.location.href = "/social-signup.html";
            }
          </script>
        `);
      }

 return res.send(`
  <script>
    const user = ${JSON.stringify(user)};
    localStorage.setItem("user", JSON.stringify(user));

    if (window.opener) {
      window.opener.localStorage.setItem("user", JSON.stringify(user));
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
