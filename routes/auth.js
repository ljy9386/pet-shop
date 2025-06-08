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
    const { user_id, name, email, password, postalCode, address, phone, pet } = req.body;

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
      pet
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
  console.log(req.body);
  const { user_id, password } = req.body;
  console.log('📥 로그인 시도:', user_id);

  let user;

  try {
    const { user_id, password } = req.body;
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
        admin: user.admin,
        pet: user.pet
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

// 카카오 로그인 콜백
router.get('/kakao/callback',
  passport.authenticate('kakao', {
    failureRedirect: '/login.html',
  }),
  (req, res) => {
    const user = req.user;
    console.log('카카오 콜백 진입, user:', user);
    res.send(`
      <script>
        localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
        window.location.href = "/index.html";
      </script>
    `);
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
    console.log('네이버 콜백 진입, user:', user);
    res.send(`
      <script>
        localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
        window.location.href = "/index.html";
      </script>
    `);
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
    console.log('구글 콜백 진입, user:', user);
    res.send(`
      <script>
        localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
        window.location.href = "/index.html";
      </script>
    `);
  }
);

// 소셜 로그인 처리
router.post('/social-login', async (req, res) => {
  try {
    console.log("🔑 소셜 로그인 시도:", {
      body: req.body,
      session: req.session,
      cookies: req.cookies
    });
    
    const { user_id } = req.body;
    
    if (!user_id) {
      console.log("❌ user_id 누락");
      return res.status(400).json({ message: 'user_id가 필요합니다.' });
    }

    const user = await User.findOne({ user_id });
    console.log("👤 찾은 사용자:", user ? {
      user_id: user.user_id,
      name: user.name,
      provider: user.provider
    } : "없음");
    
    if (!user) {
      console.log("❌ 사용자를 찾을 수 없음:", user_id);
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 세션에 사용자 정보 저장
    const sessionUser = {
      user_id: user.user_id,
      name: user.name,
      provider: user.provider,
      isLoggedIn: true
    };
    console.log("💾 세션에 저장할 사용자 정보:", sessionUser);
    req.session.user = sessionUser;
    
    // 세션 저장 확인
    req.session.save((err) => {
      if (err) {
        console.error("❌ 세션 저장 실패:", err);
        return res.status(500).json({ message: '세션 저장 실패' });
      }
      console.log("✅ 세션 저장 성공");
    });

    // 클라이언트에 전달할 사용자 정보
    const userData = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      postalCode: user.postalCode,
      address: user.address,
      phone: user.phone,
      admin: user.admin,
      provider: user.provider,
      pet: user.pet,
      isLoggedIn: true
    };
    console.log("📤 클라이언트에 전달할 사용자 정보:", userData);

    res.json({ 
      message: '로그인 성공',
      user: userData
    });
    console.log("✅ 소셜 로그인 성공:", user_id);
  } catch (err) {
    console.error('❌ 소셜 로그인 에러:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;
