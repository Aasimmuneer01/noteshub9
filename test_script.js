        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
        import { getFirestore, collection, doc, getDoc, getDocs, onSnapshot, query, where, orderBy, updateDoc, setDoc, deleteDoc, serverTimestamp, limit, collectionGroup, arrayUnion, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

        // CONFIG INJECTION
        const firebaseConfig = {
            apiKey: "AIzaSyAjpGS1Oj6yhHv3wv4F2tET69N_Qe9DMh0",
            authDomain: "resourceswebsite-4871a.firebaseapp.com",
            projectId: "resourceswebsite-4871a",
            storageBucket: "resourceswebsite-4871a.firebasestorage.app",
            messagingSenderId: "499105267177",
            appId: "1:499105267177:web:d88137205e617e294c1f78"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        setPersistence(auth, browserLocalPersistence).catch(console.error);
        const db = getFirestore(app);
        const creatorDocRef = doc(db, 'settings', 'creator');
        
        window.db = db;
        window.doc = doc;
        window.collection = collection;
        window.getDoc = getDoc;
        window.getDocs = getDocs;
        window.setDoc = setDoc;
        window.addDoc = addDoc;
        window.updateDoc = updateDoc;
        window.deleteDoc = deleteDoc;
        window.serverTimestamp = serverTimestamp;

        // UI STATE
        let currentUser = null;
        let usersData = [];
        let resourcesData = [];
        let categoriesData = [];
        let selectedUserId = null;
        let chartInstance = null;

        // AUTH HANDLER
        const btnLogin = document.getElementById('btn-login');
        const loginEmail = document.getElementById('login-email');
        const loginPass = document.getElementById('login-password');
        const loginError = document.getElementById('login-error');
        const loginLoader = document.getElementById('login-loader');
        const loginText = document.getElementById('login-text');
        const authOverlay = document.getElementById('auth-overlay');
        const mainLayout = document.getElementById('main-layout');

        btnLogin.addEventListener('click', async () => {
            loginError.classList.add('hidden');
            loginLoader.classList.remove('hidden');
            loginText.classList.add('opacity-0');
            
            try {
                const emailVal = loginEmail.value.trim();
                const passVal = loginPass.value;
                
                let cred;
                try {
                    cred = await signInWithEmailAndPassword(auth, emailVal, passVal);
                } catch (emailErr) {
                    if (emailErr.code === 'auth/invalid-credential' || emailErr.code === 'auth/wrong-password' || emailErr.code === 'auth/user-not-found' || emailErr.code === 'auth/missing-password') {
                        // Fallback to Google Auth popup if password fails (fixes accounts created with Continue with Google)
                        const provider = new GoogleAuthProvider();
                        cred = await signInWithPopup(auth, provider);
                    } else {
                        throw emailErr;
                    }
                }
                
                const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
                const userData = userDoc.data();
                
                const isAdminEmail = ['admin@example.com', 'aasimmuneer349@gmail.com', 'admin@eduplatform.com'].includes(cred.user.email);
                if (isAdminEmail || ['admin', 'superadmin', 'moderator'].includes(userData?.role)) {
                    // Success
                } else {
                    await signOut(auth);
                    throw new Error("Insufficient security clearance.");
                }
            } catch (err) {
                loginError.textContent = err.message;
                loginError.classList.remove('hidden');
                loginLoader.classList.add('hidden');
                loginText.classList.remove('opacity-0');
            }
        });

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const data = userDoc.data();
                const isAdminEmail = ['admin@example.com', 'aasimmuneer349@gmail.com', 'admin@eduplatform.com'].includes(user.email);
                if (isAdminEmail || ['admin', 'superadmin', 'moderator'].includes(data?.role)) {
                    currentUser = { uid: user.uid, ...data, role: data?.role || (isAdminEmail ? 'admin' : 'user') };
                    authOverlay.classList.add('hidden');
                    mainLayout.classList.remove('hidden');
                    document.getElementById('admin-name').textContent = data?.displayName || 'Admin';
                    document.getElementById('admin-role').textContent = (currentUser.role).toUpperCase() + ' ACCESS';
                    initApp();
                } else {
                    authOverlay.classList.remove('hidden');
                    mainLayout.classList.add('hidden');
                }
            } else {
                authOverlay.classList.remove('hidden');
                mainLayout.classList.add('hidden');
            }
        });

        document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

        // TAB NAVIGATION
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        const tabContents = document.querySelectorAll('.tab-content');
        const tabTitle = document.getElementById('current-tab-title');

        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.getAttribute('data-tab');
                sidebarItems.forEach(i => i.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                item.classList.add('active');
                document.getElementById(target).classList.add('active');
                tabTitle.textContent = item.textContent.trim();
                
                if (target === 'analytics') renderAnalytics();
            });
        });

        // TOAST SYSTEM
        function toast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const el = document.createElement('div');
            el.className = `glass p-4 rounded-2xl border border-white/5 shadow-2xl flex items-center gap-3 transform translate-x-10 opacity-0 transition-all duration-300`;
            const icon = type === 'error' ? 'shield-alert' : (type === 'success' ? 'check-circle' : 'info');
            const color = type === 'error' ? 'text-red-500' : (type === 'success' ? 'text-green-500' : 'text-primary');
            
            el.innerHTML = `
                <div class="p-2 bg-white/5 ${color} rounded-lg"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
                <span class="text-sm font-bold text-white">${message}</span>
            `;
            container.appendChild(el);
            lucide.createIcons();
            
            setTimeout(() => el.classList.remove('translate-x-10', 'opacity-0'), 10);
            setTimeout(() => {
                el.classList.add('translate-x-10', 'opacity-0');
                setTimeout(() => el.remove(), 300);
            }, 3000);
        }

        // --- CHAT MANAGER ---
        let chatEnabled = false;
        let aiEnabled = false;
        let communityChatUnsubscribe = null;

        async function loadChatSettings() {
            try {
                const docRef = doc(db, 'website_control', 'settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    chatEnabled = !!data.chatEnabled;
                    aiEnabled = !!data.aiEnabled;
                }
                
                document.getElementById('chat-status-text').textContent = chatEnabled ? 'Enabled' : 'Disabled';
                document.getElementById('chat-status-text').className = chatEnabled ? 'text-green-300' : 'text-red-300';
                
                document.getElementById('toggle-ai-enabled').textContent = aiEnabled ? 'Enabled' : 'Disabled';
                document.getElementById('toggle-ai-enabled').className = aiEnabled ? 'px-6 py-3 bg-green-500/20 text-green-300 rounded-lg font-bold hover:brightness-110 border border-green-500/30' : 'px-6 py-3 bg-red-500/20 text-red-300 rounded-lg font-bold hover:brightness-110 border border-red-500/30';
                loadChatGroups();

            } catch (e) {
                console.error("Error loading chat settings", e);
            }
        }

        document.getElementById('toggle-chat-enabled').addEventListener('click', async () => {
            chatEnabled = !chatEnabled;
            try {
                await setDoc(doc(db, 'website_control', 'settings'), { chatEnabled }, { merge: true });
                toast('Chat system ' + (chatEnabled ? 'enabled' : 'disabled'), 'success');
                loadChatSettings();
            } catch (e) {
                toast('Error updating chat settings', 'error');
            }
        });


        document.getElementById('send-broadcast').addEventListener('click', async () => {
            const msg = document.getElementById('broadcast-message').value.trim();
            if (!msg) return toast('Please enter a message', 'error');
            try {
                const chatRef = collection(db, 'chats', 'community', 'messages');
                await setDoc(doc(chatRef), {
                    content: msg,
                    senderId: 'admin',
                    senderName: 'Admin Broadcast',
                    senderAvatar: '',
                    timestamp: serverTimestamp(),
                    isBroadcast: true
                });
                document.getElementById('broadcast-message').value = '';
                toast('Broadcast sent successfully', 'success');
            } catch(e) {
                console.error(e);
                toast('Error sending broadcast', 'error');
            }
        });

        const modalCommunityChat = document.getElementById('modal-community-chat');

        async function loadChatGroups() {
            try {
                const q = query(collection(db, 'chats'));
                const snapshot = await getDocs(q);
                const container = document.getElementById('admin-chat-groups');
                container.innerHTML = '';
                
                let foundCommunity = false;
                const groups = [];
                snapshot.forEach(docSnap => {
                    if (docSnap.id === 'community') foundCommunity = true;
                    groups.push({ id: docSnap.id, ...docSnap.data() });
                });
                
                if (!foundCommunity) {
                    groups.unshift({ id: 'community', name: 'NotesHub9 Community', isDefault: true });
                }
                
                if (groups.length === 0) {
                    container.innerHTML = '<div class="text-center text-gray-500 py-10">No conversations found</div>';
                    return;
                }

                // Fetch latest message for each group
                for (let group of groups) {
                    try {
                        const msgQ = query(collection(db, 'chats', group.id, 'messages'), orderBy('timestamp', 'desc'), limit(1));
                        const msgSnap = await getDocs(msgQ);
                        if (!msgSnap.empty) {
                            const msgData = msgSnap.docs[0].data();
                            group.lastMessage = msgData.content || msgData.text || 'No text';
                            group.lastMessageTime = msgData.timestamp?.toDate ? msgData.timestamp.toDate().toLocaleString() : 'Recent';
                        } else {
                            group.lastMessage = 'No messages';
                            group.lastMessageTime = 'N/A';
                        }
                    } catch (e) {
                        group.lastMessage = 'Unknown';
                        group.lastMessageTime = '';
                    }
                }
                
                groups.forEach(group => {
                    let title = group.name || group.id;
                    let subtitle = '';
                    if (group.id !== 'community' && group.participants && group.participants.length >= 2) {
                        const u1 = usersData.find(u => u.uid === group.participants[0]);
                        const u2 = usersData.find(u => u.uid === group.participants[1]);
                        const n1 = u1 ? (u1.displayName || u1.name || u1.email || group.participants[0]) : group.participants[0];
                        const n2 = u2 ? (u2.displayName || u2.name || u2.email || group.participants[1]) : group.participants[1];
                        title = `${n1} & ${n2}`;
                        subtitle = `Emails: ${u1?.email || 'N/A'} | ${u2?.email || 'N/A'}`;
                    } else if (group.id === 'community') {
                        subtitle = 'Public Community Group';
                    } else {
                        subtitle = 'Private/Group Chat';
                    }

                    const el = document.createElement('div');
                    el.className = "p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer transition-all";
                    el.innerHTML = `
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-bold shrink-0">
                                <i data-lucide="message-square" class="w-5 h-5"></i>
                            </div>
                            <div class="overflow-hidden">
                                <h5 class="font-bold text-lg truncate">${title}</h5>
                                <p class="text-xs text-gray-400 truncate">${subtitle}</p>
                                <p class="text-sm text-gray-300 mt-1 truncate">Last: ${group.lastMessage}</p>
                                <p class="text-[10px] text-gray-500">${group.lastMessageTime}</p>
                            </div>
                        </div>
                        <button class="btn-manage-chat px-6 py-2 bg-primary text-secondary font-bold rounded-lg shrink-0" data-id="${group.id}">Manage</button>
                    `;
                    container.appendChild(el);
                });
                
                lucide.createIcons();
                
                container.querySelectorAll('.btn-manage-chat').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const chatId = e.currentTarget.getAttribute('data-id');
                        openChatModeration(chatId);
                    });
                });
                
            } catch (e) {
                console.error(e);
                document.getElementById('admin-chat-groups').innerHTML = '<div class="text-red-500 text-center py-10">Error loading conversations</div>';
            }
        }
        
        function openChatModeration(chatId) {
            modalContainer.classList.remove('hidden');
            modalCommunityChat.classList.remove('hidden');
            setTimeout(() => modalCommunityChat.classList.remove('scale-95', 'opacity-0'), 10);
            
            const titleEl = modalCommunityChat.querySelector('h3');
            titleEl.textContent = chatId === 'community' ? 'NotesHub9 Community' : `Chat: ${chatId}`;
            
            const btnMarkRead = document.getElementById('btn-mark-read');
            btnMarkRead.onclick = async () => {
                try {
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                            [`lastReadChats.${chatId}`]: serverTimestamp()
                        });
                        toast('Marked as read', 'success');
                    }
                } catch (e) {
                    toast('Error marking as read', 'error');
                }
            };
            
            const btnDeleteEntire = document.getElementById('btn-delete-entire-chat');
            if (chatId === 'community') {
                btnDeleteEntire.classList.add('hidden');
            } else {
                btnDeleteEntire.classList.remove('hidden');
                btnDeleteEntire.onclick = async () => {
                    if (confirm('Are you sure you want to delete this entire conversation?')) {
                        try {
                            const msgs = await getDocs(collection(db, 'chats', chatId, 'messages'));
                            for (let m of msgs.docs) {
                                await deleteDoc(m.ref);
                            }
                            await deleteDoc(doc(db, 'chats', chatId));
                            toast('Chat deleted completely', 'success');
                            closeModal();
                            loadChatGroups();
                        } catch (e) {
                            toast('Error deleting chat', 'error');
                        }
                    }
                };
            }

            // Unsubscribe from previous if any
            if (typeof communityChatUnsubscribe !== "undefined" && communityChatUnsubscribe) {
                communityChatUnsubscribe();
            }
            
            const container = document.getElementById('admin-chat-messages');
            container.innerHTML = '<div class="text-center text-gray-500 py-10"><i data-lucide="loader" class="animate-spin w-8 h-8 mx-auto mb-2"></i> Loading messages...</div>';
            lucide.createIcons();
            
            // Listen to messages
            const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'desc'), limit(100));
            communityChatUnsubscribe = onSnapshot(q, (snapshot) => {
                container.innerHTML = '';
                if(snapshot.empty) {
                    container.innerHTML = '<div class="text-center text-gray-500 py-10">No messages found</div>';
                    return;
                }
                
                snapshot.forEach(docSnap => {
                    const msg = docSnap.data();
                    // Resolve user names using usersData fallback
                    let senderName = msg.senderName;
                    let senderAvatar = msg.senderAvatar;
                    if (!senderName && msg.senderId) {
                        const u = usersData.find(u => u.uid === msg.senderId);
                        if (u) {
                            senderName = u.displayName || u.name || u.email;
                            senderAvatar = u.photoURL || u.avatar;
                        } else {
                            senderName = msg.senderId;
                        }
                    }

                    const el = document.createElement('div');
                    el.className = "p-4 bg-white/5 rounded-xl border border-white/5 flex gap-4 relative group";
                    el.innerHTML = `
                        <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                            ${senderAvatar ? '<img src="' + senderAvatar + '" class="w-full h-full object-cover">' : (senderName ? senderName.substring(0, 1).toUpperCase() : 'U')}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-bold">${senderName || 'Anonymous'}</span>
                                <span class="text-[10px] text-gray-500">${msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : 'Just now'}</span>
                                ${msg.isBroadcast ? '<span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] uppercase font-bold rounded">Broadcast</span>' : ''}
                            </div>
                            <p class="text-gray-300 text-sm whitespace-pre-wrap">${msg.content || msg.text || ''}</p>
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-all absolute right-4 top-4 flex gap-2">
                            <button class="btn-delete-msg p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all" data-id="${docSnap.id}" title="Delete Message">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                            ${msg.senderId !== 'admin' ? `
                            <button class="btn-ban-user p-2 bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg transition-all" data-uid="${msg.senderId}" title="Ban/Mute User">
                                <i data-lucide="user-x" class="w-4 h-4"></i>
                            </button>
                            ` : ''}
                        </div>
                    `;
                    container.appendChild(el);
                });
                lucide.createIcons();
                
                // Attach event listeners using delegation
                container.addEventListener('click', async (e) => {
                    const deleteBtn = e.target.closest('.btn-delete-msg');
                    const banBtn = e.target.closest('.btn-ban-user');
                    
                    if (deleteBtn) {
                        const id = deleteBtn.getAttribute('data-id');
                        if (confirm('Delete this message?')) {
                            await deleteDoc(doc(db, 'chats', chatId, 'messages', id));
                            toast('Message deleted', 'success');
                        }
                    } else if (banBtn) {
                        const uid = banBtn.getAttribute('data-uid');
                        const user = usersData.find(u => u.uid === uid);
                        if(user) {
                            closeModal();
                            setTimeout(() => openUserModal(uid), 350);
                        } else {
                            toast('User data not found', 'error');
                        }
                    }
                });
            });
        }

        // INITIALIZATION
        async function initApp() {
            lucide.createIcons();
            startListeners();
            initEventListeners();
            loadCreatorData();
            loadWebsiteControl();
                loadChatSettings();
            loadAiConfig();
            loadAiSupportAnalytics();
            loadAiStatus();
        }

        async function loadAiSupportAnalytics() {
            // Summary stats
            onSnapshot(doc(db, 'analytics', 'summary'), (doc) => {
                const data = doc.data() || {};
                document.getElementById('stat-total-emails').innerText = data.totalEmailsReceived || 0;
                document.getElementById('stat-total-replies').innerText = data.totalAIRepliesSent || 0;
                document.getElementById('stat-failed-replies').innerText = data.failedReplies || 0;
                document.getElementById('stat-last-email').innerText = data.lastReceivedEmail ? new Date(data.lastReceivedEmail).toLocaleTimeString() : 'No emails yet';
                document.getElementById('stat-last-reply').innerText = data.lastAIReplyTime ? new Date(data.lastAIReplyTime).toLocaleTimeString() : 'No activity';
            }, (error) => console.warn('Snapshot error (analytics/summary):', error));

            // Pending reviews count
            onSnapshot(collection(db, 'pendingReviews'), (snapshot) => {
                document.getElementById('stat-pending-emails').innerText = snapshot.size;
            }, (error) => console.warn('Snapshot error (pendingReviews size):', error));

            // Recent activity
            const logsQuery = query(collection(db, 'emailLogs'), orderBy('timestamp', 'desc'), limit(10));
            onSnapshot(logsQuery, (snapshot) => {
                const logsDiv = document.getElementById('activity-log');
                logsDiv.innerHTML = '';
                if (snapshot.empty) {
                    logsDiv.innerHTML = '<p class="text-xs text-gray-500">No activity</p>';
                    return;
                }
                snapshot.forEach(doc => {
                    const log = doc.data();
                    const logEl = document.createElement('div');
                    logEl.className = 'flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5';
                    logEl.innerHTML = `
                        <span class="font-bold text-xs">${log.emailId.substring(0,20)}...</span>
                        <span class="text-xs ${log.status === 'success' ? 'text-green-500' : 'text-red-500'}">${log.status.toUpperCase()}</span>
                    `;
                    logsDiv.appendChild(logEl);
                });
            }, (error) => console.warn('Snapshot error (logsQuery):', error));

            // Pending reviews
            const pendingQuery = query(collection(db, 'pendingReviews'), orderBy('timestamp', 'desc'), limit(10));
            onSnapshot(pendingQuery, (snapshot) => {
                const pendingDiv = document.getElementById('pending-reviews');
                pendingDiv.innerHTML = '';
                if (snapshot.empty) {
                    pendingDiv.innerHTML = '<p class="text-xs text-gray-500">No emails awaiting review</p>';
                    return;
                }
                snapshot.forEach(doc => {
                    const review = doc.data();
                    const reviewEl = document.createElement('div');
                    reviewEl.className = 'flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5';
                    reviewEl.innerHTML = `
                        <span class="font-bold text-xs">${review.emailId.substring(0,20)}...</span>
                        <span class="text-xs text-yellow-500">${review.reason || 'Pending Review'}</span>
                    `;
                    pendingDiv.appendChild(reviewEl);
                });
            }, (error) => console.warn('Snapshot error (pendingQuery):', error));
        }

        async function loadAiConfig() {
            try {
                const docRef = doc(db, 'ai_settings', 'global');
                const docSnap = await getDoc(docRef);
                const config = docSnap.exists() ? docSnap.data() : { enabled: true, maintenanceMode: false, providers: {} };
                
                if (config.enabled !== undefined) {
                    document.getElementById('toggle-ai-enabled').innerText = config.enabled ? 'Enabled' : 'Disabled';
                    if (config.providers && config.providers.groq) {
                        document.getElementById('groq-api-key').value = config.providers.groq.apiKey || '';
                    }
                }
            } catch (e) {
                console.error('Load AI config error:', e);
            }
        }



        const saveGroqBtn = document.getElementById('save-groq');
        if (saveGroqBtn) {
            saveGroqBtn.addEventListener('click', async () => {
                const apiKey = document.getElementById('groq-api-key').value;
                try {
                    const docRef = doc(db, 'ai_settings', 'global');
                    await setDoc(docRef, { providers: { groq: { apiKey } } }, { merge: true });
                    toast('Groq API key saved', 'success');
                } catch (e) {
                    console.error('Save Groq error:', e);
                    toast('Failed to save Groq key: ' + e.message, 'error');
                }
            });
        }

        async function loadWebsiteControl() {
            try {
                const docRef = doc(db, 'website_control', 'settings');
                const docSnap = await getDoc(docRef);
                const settings = docSnap.exists() ? docSnap.data() : { mode: 'Online' };
                
                // ... Existing logic ...
                const radios = document.getElementsByName('website-status');
                for (const radio of radios) {
                    if (radio.value === settings.mode) {
                        radio.checked = true;
                        break;
                    }
                }
                
                document.getElementById('shutdown-title').value = settings.title || '';
                document.getElementById('shutdown-description').value = settings.description || '';
                document.getElementById('shutdown-return-date').value = settings.returnDate || '';
                document.getElementById('shutdown-email').value = settings.contactEmail || '';
                
                // New logic
                const globalFreePremium = !!settings.globalFreePremium;
                document.getElementById('toggle-global-premium').checked = globalFreePremium;
                document.getElementById('global-premium-status').textContent = globalFreePremium ? 'ON' : 'OFF';
            } catch (e) {
                console.error('Load website control error:', e);
            }
        }





        document.getElementById('save-website-settings').addEventListener('click', async () => {
            let selectedMode = 'Online';
            const radios = document.getElementsByName('website-status');
            for (const radio of radios) {
                if (radio.checked) {
                    selectedMode = radio.value;
                    break;
                }
            }

            const settings = {
                mode: selectedMode,
                enabled: selectedMode === 'Online',
                title: document.getElementById('shutdown-title').value,
                description: document.getElementById('shutdown-description').value,
                returnDate: document.getElementById('shutdown-return-date').value,
                contactEmail: document.getElementById('shutdown-email').value
            };
            try {
                const docRef = doc(db, 'website_control', 'settings');
                await setDoc(docRef, settings, { merge: true });
                toast('Website status and settings updated', 'success');
            } catch (e) {
                console.error('Save settings error:', e);
                toast('Failed to update settings: ' + e.message, 'error');
            }
        });

        async function loadCreatorData() {
            try {
                const snap = await getDoc(creatorDocRef);
                if (snap.exists()) {
                    const data = snap.data();
                    document.getElementById('c-name').value = data.name || '';
                    document.getElementById('c-bio').value = data.bio || '';
                    document.getElementById('c-x').value = data.x || '';
                    document.getElementById('c-ig').value = data.ig || '';
                    document.getElementById('c-img-url').value = data.imageUrl || '';
                    document.getElementById('c-img-preview').src = data.imageUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop';
                }
            } catch (err) { console.error("Error loading creator:", err); }
        }

        document.getElementById('save-creator').addEventListener('click', async () => {
            const data = {
                name: document.getElementById('c-name').value,
                bio: document.getElementById('c-bio').value,
                x: document.getElementById('c-x').value,
                ig: document.getElementById('c-ig').value,
                imageUrl: document.getElementById('c-img-url').value,
                updatedAt: serverTimestamp()
            };
            try {
                await setDoc(creatorDocRef, data, { merge: true });
                toast("Creator profile updated", "success");
            } catch (err) { toast(err.message, "error"); }
        });

        function startListeners() {
            // USERS LISTENER
            onSnapshot(collection(db, 'users'), (snap) => {
                usersData = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
                updateDashboardStats();
                updateUsersTable();
                updatePremiumAnalytics();
                updatePremiumUsersList();
                checkExpirations(); // Auto-revocation logic
            }, (error) => console.warn('Snapshot error (users):', error));

            // RESOURCES LISTENER
            onSnapshot(collection(db, 'resources'), (snap) => {
                resourcesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                updateDashboardStats();
                updateResourcesList();
                updateUploadCategories();
            }, (error) => console.warn('Snapshot error (resources):', error));

            // CATEGORIES LISTENER
            onSnapshot(query(collection(db, 'categories'), orderBy('name')), (snap) => {
                categoriesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                updateCategoriesGrid();
                updateUploadCategories();
            }, (error) => console.warn('Snapshot error (categories):', error));

            // BROADCAST HISTORY LISTENER
            const broadcastQuery = query(
                collection(db, 'chats', 'community', 'messages'),
                where('isBroadcast', '==', true)
            );
            onSnapshot(broadcastQuery, (snap) => {
                const container = document.getElementById('broadcast-history');
                if (!container) return;
                
                if (snap.empty) {
                    container.innerHTML = '<div class="text-center text-gray-500 py-6">No broadcasts sent yet.</div>';
                    return;
                }
                
                // Sort client-side to avoid composite index requirement
                const sortedDocs = [...snap.docs].sort((a, b) => {
                    const tA = a.data().timestamp?.toMillis() || 0;
                    const tB = b.data().timestamp?.toMillis() || 0;
                    return tB - tA; // desc
                });
                
                container.innerHTML = '';
                sortedDocs.forEach(docSnap => {
                    const data = docSnap.data();
                    const id = docSnap.id;
                    const timeStr = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Just now';
                    
                    const el = document.createElement('div');
                    el.className = 'p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-start gap-4';
                    el.innerHTML = `
                        <div class="flex-1">
                            <div class="text-xs text-gray-400 mb-1 flex items-center gap-2">
                                <span class="font-bold text-primary">${data.senderName || 'Admin'}</span>
                                <span>&bull;</span>
                                <span>${timeStr}</span>
                            </div>
                            <p class="text-sm text-gray-200">${data.content || data.text}</p>
                        </div>
                        <button class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" onclick="deleteBroadcast('${id}')">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    `;
                    container.appendChild(el);
                });
                lucide.createIcons();
            }, (error) => console.warn('Snapshot error (broadcasts):', error));
        }

        window.deleteBroadcast = async (id) => {
            if (!confirm('Are you sure you want to delete this broadcast for everyone?')) return;
            try {
                await deleteDoc(doc(db, 'chats', 'community', 'messages', id));
                toast('Broadcast deleted', 'success');
            } catch (error) {
                console.error(error);
                toast('Failed to delete broadcast', 'error');
            }
        };

        // AUTO-REVOCATION LOGIC
        async function checkExpirations() {
            const now = new Date();
            const expired = usersData.filter(u => u.isPremium && u.premiumExpiry && u.premiumPlan !== 'Lifetime' && u.premiumExpiry.toDate() < now);
            
            for (const u of expired) {
                try {
                    await updateDoc(doc(db, 'users', u.uid), {
                        isPremium: false,
                        premiumStatus: 'expired'
                    });
                    console.log(`[CORE] System auto-revoked premium for: ${u.email}`);
                } catch (err) {
                    console.error(`[CRITICAL] Revocation failed for ${u.email}:`, err);
                }
            }
        }

        // UI UPDATERS
        function updateDashboardStats() {
            const total = usersData.length;
            const banned = usersData.filter(u => u.isBanned).length;
            const premium = usersData.filter(u => u.isPremium).length;
            const active = total - banned;

            document.getElementById('stat-total-users').textContent = total;
            document.getElementById('stat-banned-users').textContent = banned;
            document.getElementById('stat-premium-users').textContent = premium;
            document.getElementById('stat-active-users').textContent = active;

            let totalViews = 0;
            let totalDownloads = 0;
            resourcesData.forEach(r => {
                totalViews += (r.viewCount || 0);
                totalDownloads += (r.downloadCount || 0);
            });

            document.getElementById('stat-total-views').textContent = totalViews;
            document.getElementById('stat-total-downloads').textContent = totalDownloads;
            document.getElementById('stat-total-resources').textContent = resourcesData.length;

            renderDashboardChart();
        }

        function updateUsersTable() {
            const search = document.getElementById('user-search').value.toLowerCase();
            const filtered = usersData.filter(u => 
                u.displayName?.toLowerCase().includes(search) || 
                u.email?.toLowerCase().includes(search) || 
                u.uid.includes(search)
            ).slice(0, 50);

            const body = document.getElementById('users-table-body');
            body.innerHTML = '';

            filtered.forEach(u => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors group';
                
                const regDate = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A';
                const premiumTime = getRemainingTime(u);

                tr.innerHTML = `
                    <td class="px-8 py-5">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center font-black text-white border border-white/10">${u.displayName?.charAt(0) || 'U'}</div>
                            <div>
                                <p class="text-sm font-bold text-white">${u.displayName || 'Unset'}</p>
                                <p class="text-[10px] text-gray-500 font-mono">${u.email}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-8 py-5">
                        <span class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${u.isBanned ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}">
                            ${u.isBanned ? 'Banned' : 'Active'}
                        </span>
                    </td>
                    <td class="px-8 py-5">
                        <div class="flex flex-col gap-1">
                            <span class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase w-fit ${u.isPremium ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-surface text-gray-500 border border-white/5'}">
                                ${u.isPremium ? 'Premium' : 'Free'}
                            </span>
                            ${u.isPremium ? `<span class="text-[8px] font-mono text-gray-400 font-bold">${premiumTime}</span>` : ''}
                        </div>
                    </td>
                    <td class="px-8 py-5">
                        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Joined</p>
                        <p class="text-xs font-mono text-white">${regDate}</p>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onclick="openUserModal('${u.uid}')" class="p-2 bg-white/5 rounded-lg hover:text-primary transition-all"><i data-lucide="eye" class="w-4 h-4"></i></button>
                            <button onclick="openPremiumModal('${u.uid}')" class="p-2 bg-white/5 rounded-lg hover:text-yellow-500 transition-all"><i data-lucide="crown" class="w-4 h-4"></i></button>
                        </div>
                    </td>
                `;
                body.appendChild(tr);
            });
            lucide.createIcons();
        }

        function getRemainingTime(u) {
            if (!u.isPremium || !u.premiumExpiry) return '';
            if (u.premiumPlan === 'Lifetime') return 'Infinity';
            
            const now = new Date();
            const expiry = u.premiumExpiry.toDate();
            const diff = expiry - now;
            
            if (diff <= 0) return 'Expired';
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return `${days}d ${hours}h`;
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m remaining`;
        }

        function updatePremiumAnalytics() {
            const now = new Date();
            const todayStr = now.toDateString();

            const premium = usersData.filter(u => u.isPremium).length;
            const expiringToday = usersData.filter(u => {
                if (!u.isPremium || !u.premiumExpiry || u.premiumPlan === 'Lifetime') return false;
                return u.premiumExpiry.toDate().toDateString() === todayStr;
            }).length;

            const expiringWeek = usersData.filter(u => {
                if (!u.isPremium || !u.premiumExpiry || u.premiumPlan === 'Lifetime') return false;
                const expiry = u.premiumExpiry.toDate();
                const week = new Date(now);
                week.setDate(now.getDate() + 7);
                return expiry > now && expiry <= week;
            }).length;

            const expiredToday = usersData.filter(u => {
                if (!u.premiumExpiry || u.isPremium) return false;
                return u.premiumExpiry.toDate().toDateString() === todayStr;
            }).length;

            const expiredTotal = usersData.filter(u => u.premiumStatus === 'expired').length;

            document.getElementById('stat-prem-total').textContent = premium;
            document.getElementById('stat-prem-today').textContent = expiringToday;
            document.getElementById('stat-prem-week').textContent = expiringWeek;
            document.getElementById('stat-prem-expired-today').textContent = expiredToday;
            document.getElementById('stat-prem-expired-total').textContent = expiredTotal;
        }

        function updatePremiumUsersList() {
            const list = document.getElementById('premium-users-list');
            list.innerHTML = '';
            
            const premiumUsers = usersData.filter(u => u.isPremium).sort((a, b) => {
                if (a.premiumPlan === 'Lifetime') return 1;
                if (b.premiumPlan === 'Lifetime') return -1;
                return (a.premiumExpiry?.toDate() || 0) - (b.premiumExpiry?.toDate() || 0);
            });

            if (premiumUsers.length === 0) {
                list.innerHTML = '<div class="text-center py-10 text-gray-600 font-bold uppercase tracking-widest">No Premium Assets Detected</div>';
                return;
            }

            premiumUsers.forEach(u => {
                const el = document.createElement('div');
                el.className = 'flex items-center justify-between p-4 bg-background rounded-2xl border border-white/5 group hover:border-yellow-500/30 transition-all';
                const time = getRemainingTime(u);
                
                el.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center"><i data-lucide="crown" class="w-5 h-5"></i></div>
                        <div>
                            <p class="text-white font-bold text-sm">${u.displayName || 'Unset'}</p>
                            <p class="text-[10px] text-gray-500 font-mono">${u.email}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Plan: ${u.premiumPlan}</p>
                        <p class="text-sm font-black font-mono text-yellow-500">${time}</p>
                    </div>
                `;
                list.appendChild(el);
            });
            lucide.createIcons();
        }

        function updateResourcesList() {
            const search = document.getElementById('res-search').value.toLowerCase();
            const filtered = resourcesData.filter(r => r.title.toLowerCase().includes(search));
            const list = document.getElementById('resources-list');
            list.innerHTML = '';

            filtered.forEach(r => {
                const el = document.createElement('div');
                el.className = `bg-background p-5 rounded-3xl border ${r.isHidden ? 'border-red-500/20' : 'border-white/5'} flex items-center gap-4 group hover:border-primary/40 transition-all`;
                
                el.innerHTML = `
                    <div class="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-primary border border-white/5 overflow-hidden shrink-0">
                        ${r.thumbnailUrl ? `<img src="${r.thumbnailUrl}" class="w-full h-full object-cover">` : '<i data-lucide="file-text" class="w-6 h-6"></i>'}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h5 class="text-white font-bold truncate">${r.title || r.name || 'Untitled Resource'}</h5>
                            ${r.isHidden ? '<span class="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase">Hidden</span>' : ''}
                        </div>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          ${categoriesData.find(c => c.id === r.category)?.name || r.category || 'N/A'} • ${r.classLevel || 'N/A'} • ${r.subject || 'N/A'}
                        </p>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                          Upload: ${r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </p>
                        <div class="flex gap-4 mt-2">
                             <div class="flex items-center gap-1 text-[10px] text-gray-400 font-mono"><i data-lucide="eye" class="w-3 h-3"></i> ${r.viewCount || 0}</div>
                             <div class="flex items-center gap-1 text-[10px] text-gray-400 font-mono"><i data-lucide="download" class="w-3 h-3"></i> ${r.downloadCount || 0}</div>
                        </div>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onclick="openEditResourceModal('${r.id}')" class="p-2 text-primary hover:bg-primary/10 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteResource('${r.id}')" class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                `;
                list.appendChild(el);
            });
            lucide.createIcons();
        }

        function updateCategoriesGrid() {
            const grid = document.getElementById('categories-grid');
            grid.innerHTML = '';
            categoriesData.forEach(c => {
                const el = document.createElement('div');
                el.className = 'bg-background p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all';
                el.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-primary/10 text-primary rounded-lg"><i data-lucide="tag" class="w-4 h-4"></i></div>
                        <span class="text-sm font-bold text-white">${c.name}</span>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onclick="openEditCategoryModal('${c.id}')" class="p-2 text-primary hover:bg-primary/10 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                        <button onclick="deleteCategory('${c.id}')" class="p-2 text-gray-600 hover:text-red-500 rounded-lg transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                `;
                grid.appendChild(el);
            });
            lucide.createIcons();
        }

        function updateUploadCategories() {
            const select = document.getElementById('up-category');
            if (!select) return;
            select.innerHTML = '<option value="">Select Domain</option>';
            categoriesData.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                select.appendChild(opt);
            });
        }

        // CHARTS
        function renderDashboardChart() {
            const ctx = document.getElementById('mainChart').getContext('2d');
            if (chartInstance) chartInstance.destroy();
            
            // Mock data for visual impact
            const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Views',
                            data: [65, 59, 80, 81, 56, 55, 40],
                            borderColor: '#0ea5e9',
                            backgroundColor: 'rgba(14, 165, 233, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 0
                        },
                        {
                            label: 'DLS',
                            data: [28, 48, 40, 19, 86, 27, 90],
                            borderColor: '#a855f7',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false },
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold', size: 10 } } }
                    }
                }
            });
        }

        // MODAL LOGIC
        const modalContainer = document.getElementById('modal-container');
        const modalUser = document.getElementById('modal-user');
        const modalPremium = document.getElementById('modal-premium');

        window.openUserModal = (uid) => {
            selectedUserId = uid;
            const u = usersData.find(x => x.uid === uid);
            if (!u) return;

            document.getElementById('md-user-avatar').textContent = u.displayName?.charAt(0) || 'U';
            document.getElementById('md-user-name').textContent = u.displayName || 'Unset';
            document.getElementById('md-user-email').textContent = u.email;
            document.getElementById('md-user-badge-role').textContent = u.role?.toUpperCase() || 'MEMBER';
            document.getElementById('md-user-badge-status').textContent = u.isBanned ? 'BANNED' : 'ACTIVE';
            document.getElementById('md-user-badge-provider').textContent = (u.authProvider || 'password').toUpperCase();
            document.getElementById('md-user-joined').textContent = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A';
            document.getElementById('md-user-last-login').textContent = u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleString() : 'N/A';
            
            const btnBan = document.getElementById('md-btn-ban');
            btnBan.textContent = u.isBanned ? 'Authorize Account' : 'Restrict Account';
            btnBan.className = u.isBanned ? 'py-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl font-bold hover:bg-green-500 hover:text-white transition-all text-xs' : 'py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all text-xs';

            modalContainer.classList.remove('hidden');
            modalUser.classList.remove('hidden');
            setTimeout(() => modalUser.classList.remove('scale-95', 'opacity-0'), 10);
            lucide.createIcons();
        };

        window.openPremiumModal = (uid) => {
            selectedUserId = uid;
            const u = usersData.find(x => x.uid === uid);
            if (!u) return;

            // Reset state
            selectedExpiry = null;
            document.querySelectorAll('.prem-preset').forEach(b => b.classList.remove('bg-yellow-500', 'text-secondary'));
            document.getElementById('prem-custom-date').value = '';
            document.getElementById('prem-custom-time').value = '';

            document.getElementById('p-md-name').textContent = u.displayName || 'Unset';
            document.getElementById('p-md-email').textContent = u.email;

            modalContainer.classList.remove('hidden');
            modalPremium.classList.remove('hidden');
            setTimeout(() => modalPremium.classList.remove('scale-95', 'opacity-0'), 10);
            lucide.createIcons();
        };

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        const modalEditResource = document.getElementById('modal-edit-resource');
        const modalEditCategory = document.getElementById('modal-edit-category');

        function closeModal() {
            [modalUser, modalPremium, modalEditResource, modalEditCategory, modalCommunityChat].forEach(m => {
                m.classList.add('scale-95', 'opacity-0');
            });
            setTimeout(() => {
                modalContainer.classList.add('hidden');
                [modalUser, modalPremium, modalEditResource, modalEditCategory, modalCommunityChat].forEach(m => m.classList.add('hidden'));
                if (typeof communityChatUnsubscribe !== "undefined" && communityChatUnsubscribe) { communityChatUnsubscribe(); communityChatUnsubscribe = null; }
            }, 300);
        }

        // EDIT RESOURCE LOGIC
        let editingResourceId = null;
        let editingResourceIsHidden = false;

        window.openEditResourceModal = (id) => {
            console.log('Opening edit modal for:', id);
            editingResourceId = id;
            const r = resourcesData.find(x => x.id === id);
            console.log('Resource data found:', r);
            if (!r) return;

            if (!modalContainer || !modalEditResource) {
                console.error('Modal elements not found:', { modalContainer, modalEditResource });
                return;
            }

            document.getElementById('edit-up-title').value = r.title || r.name || '';
            document.getElementById('edit-up-category').value = r.category || '';
            document.getElementById('edit-up-class').value = r.classLevel || '';
            document.getElementById('edit-up-subject').value = r.subject || '';
            document.getElementById('edit-up-pdf').value = r.pdfUrl;
            document.getElementById('edit-up-thumb').value = r.thumbnailUrl || '';
            document.getElementById('edit-up-desc').value = r.description || '';
            
            editingResourceIsHidden = !!r.isHidden;
            updateVisibilityUI();

            modalContainer.classList.remove('hidden');
            modalEditResource.classList.remove('hidden');
            setTimeout(() => modalEditResource.classList.remove('scale-95', 'opacity-0'), 10);
            
            // Populate categories in edit select
            const select = document.getElementById('edit-up-category');
            select.innerHTML = '<option value="">Select Domain</option>';
            categoriesData.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                if (c.id === r.category) opt.selected = true;
                select.appendChild(opt);
            });
            lucide.createIcons();
        };

        function updateVisibilityUI() {
            const track = document.getElementById('visibility-toggle-track');
            const thumb = document.getElementById('visibility-toggle-thumb');
            const label = document.getElementById('visibility-label');
            
            if (editingResourceIsHidden) {
                track.classList.replace('bg-secondary', 'bg-red-500/20');
                thumb.classList.add('ml-auto', 'bg-red-500');
                thumb.classList.remove('bg-gray-500');
                label.textContent = "Hidden";
                label.classList.replace('text-gray-500', 'text-red-500');
            } else {
                track.classList.replace('bg-red-500/20', 'bg-secondary');
                thumb.classList.remove('ml-auto', 'bg-red-500');
                thumb.classList.add('bg-gray-500');
                label.textContent = "Visible";
                label.classList.replace('text-red-500', 'text-gray-500');
            }
        }

        document.getElementById('btn-toggle-visibility').addEventListener('click', () => {
            editingResourceIsHidden = !editingResourceIsHidden;
            updateVisibilityUI();
        });

        document.getElementById('btn-save-resource').addEventListener('click', async () => {
            if (!editingResourceId) return;
            const data = {
                title: document.getElementById('edit-up-title').value,
                category: document.getElementById('edit-up-category').value,
                classLevel: document.getElementById('edit-up-class').value,
                subject: document.getElementById('edit-up-subject').value,
                pdfUrl: document.getElementById('edit-up-pdf').value,
                thumbnailUrl: document.getElementById('edit-up-thumb').value,
                description: document.getElementById('edit-up-desc').value,
                isHidden: editingResourceIsHidden
            };

            try {
                await updateDoc(doc(db, 'resources', editingResourceId), data);
                toast("Asset metadata synchronized", "success");
                closeModal();
            } catch (err) { toast(err.message, "error"); }
        });

        // EDIT CATEGORY LOGIC
        let editingCategoryId = null;
        window.openEditCategoryModal = (id) => {
            editingCategoryId = id;
            const c = categoriesData.find(x => x.id === id);
            if (!c) return;

            document.getElementById('edit-cat-name').value = c.name;
            modalContainer.classList.remove('hidden');
            modalEditCategory.classList.remove('hidden');
            setTimeout(() => modalEditCategory.classList.remove('scale-95', 'opacity-0'), 10);
            lucide.createIcons();
        };

        document.getElementById('btn-save-category').addEventListener('click', async () => {
            if (!editingCategoryId) return;
            const name = document.getElementById('edit-cat-name').value;
            try {
                await updateDoc(doc(db, 'categories', editingCategoryId), { name });
                toast("Category node updated", "success");
                closeModal();
            } catch (err) { toast(err.message, "error"); }
        });

        // BAN ACTIONS
        document.getElementById('md-btn-ban').addEventListener('click', async () => {
            if (!selectedUserId) return;
            const u = usersData.find(x => x.uid === selectedUserId);
            
            if (u.isBanned) {
                // Perform Unban
                try {
                    await updateDoc(doc(db, 'users', selectedUserId), {
                        isBanned: false,
                        accountStatus: 'active',
                        banReason: '',
                        banUntil: null
                    });
                    toast('Account authorized successfully', 'success');
                    closeModal();
                } catch (err) { toast(err.message, 'error'); }
            } else {
                // Open Ban Modal
                const modalBan = document.getElementById('modal-ban');
                modalBan.classList.remove('hidden');
            }
        });

        // WARNING ACTIONS
        document.getElementById('md-btn-warning').addEventListener('click', () => {
            document.getElementById('modal-warning').classList.remove('hidden');
        });

        document.getElementById('confirm-warning-btn').addEventListener('click', async () => {
            if (!selectedUserId) return;
            const u = usersData.find(x => x.uid === selectedUserId);
            const reason = document.getElementById('warning-reason-input').value.trim() || 'No reason provided.';
            
            try {
                const currentWarnings = u.warnings || [];
                const newWarning = {
                    date: new Date(),
                    reason: reason,
                    adminName: 'Administrator'
                };
                
                const updateData = {
                    warnings: arrayUnion(newWarning),
                    warningCount: (u.warningCount || 0) + 1,
                    accountStatus: 'warning',
                    warningAcknowledged: false
                };
                
                await updateDoc(doc(db, 'users', selectedUserId), updateData);
                toast('Warning issued successfully', 'success');
                document.getElementById('modal-warning').classList.add('hidden');
                document.getElementById('warning-reason-input').value = '';
                closeModal();
            } catch (err) { toast(err.message, 'error'); }
        });

        document.getElementById('md-btn-reset-warnings').addEventListener('click', async () => {
            if (!selectedUserId || !confirm("Reset all warnings for this user?")) return;
            try {
                await updateDoc(doc(db, 'users', selectedUserId), {
                    warnings: [],
                    warningCount: 0,
                    accountStatus: 'active',
                    warningAcknowledged: true
                });
                toast('Warnings reset successfully', 'success');
                closeModal();
            } catch (err) { toast(err.message, 'error'); }
        });

        document.getElementById('confirm-ban-btn').addEventListener('click', async () => {
            if (!selectedUserId) return;
            const reason = document.getElementById('ban-reason-input').value.trim() || 'Violation of service terms.';
            const banUntil = document.getElementById('ban-until-input').value;
            try {
                const updateData = {
                    isBanned: true,
                    accountStatus: 'banned',
                    banReason: reason
                };
                if (banUntil) updateData.banUntil = banUntil;
                await updateDoc(doc(db, 'users', selectedUserId), updateData);
                toast('Account restricted successfully', 'success');
                document.getElementById('modal-ban').classList.add('hidden');
                closeModal();
            } catch (err) { toast(err.message, 'error'); }
        });

        // Other modal cancel handlers
        document.querySelectorAll('.btn-cancel-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.fixed').classList.add('hidden');
            });
        });

        document.getElementById('md-btn-verify').addEventListener('click', async () => {
             if (!selectedUserId) return;
             try {
                await updateDoc(doc(db, 'users', selectedUserId), { emailVerified: true });
                toast("Email validation forced", "success");
                closeModal();
             } catch (err) { toast(err.message, "error"); }
        });

        document.getElementById('md-btn-delete').addEventListener('click', async () => {
            if (!confirm("CRITICAL: This will purge all user data from Firestore. Proceed?")) return;
            try {
                // Delete user document
                await deleteDoc(doc(db, 'users', selectedUserId));
                
                // Delete bookmarks
                const bookmarksQuery = query(collection(db, 'bookmarks'), where('userId', '==', selectedUserId));
                const bookmarksSnapshot = await getDocs(bookmarksQuery);
                for (const docSnapshot of bookmarksSnapshot.docs) {
                    await deleteDoc(docSnapshot.ref);
                }

                toast("Data terminated", "success");
                closeModal();
            } catch (err) { toast(err.message, "error"); }
        });

        // PREMIUM GRANT LOGIC
        let selectedExpiry = null;
        document.querySelectorAll('.prem-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.prem-preset').forEach(b => b.classList.remove('bg-yellow-500', 'text-secondary'));
                btn.classList.add('bg-yellow-500', 'text-secondary');
                
                // Clear custom inputs when preset selected
                document.getElementById('prem-custom-date').value = '';
                document.getElementById('prem-custom-time').value = '';

                const dur = btn.getAttribute('data-duration');
                const now = new Date();
                
                if (dur === '1h') now.setHours(now.getHours() + 1);
                else if (dur === '1d') now.setDate(now.getDate() + 1);
                else if (dur === '7d') now.setDate(now.getDate() + 7);
                else if (dur === '1mo') now.setMonth(now.getMonth() + 1);
                else if (dur === '3mo') now.setMonth(now.getMonth() + 3);
                else if (dur === '6mo') now.setMonth(now.getMonth() + 6);
                else if (dur === '1y') now.setFullYear(now.getFullYear() + 1);
                else if (dur === 'inf') { 
                    selectedExpiry = 'lifetime'; 
                    document.getElementById('prem-custom-date').value = '';
                    document.getElementById('prem-custom-time').value = '';
                    return; 
                }
                
                selectedExpiry = now;

                // Also update custom inputs to show what was selected
                const dateStr = now.toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
                document.getElementById('prem-custom-date').value = dateStr;
                document.getElementById('prem-custom-time').value = timeStr;
            });
        });

        // Clear presets when typing in custom date
        document.getElementById('prem-custom-date').addEventListener('change', () => {
            document.querySelectorAll('.prem-preset').forEach(b => b.classList.remove('bg-yellow-500', 'text-secondary'));
            selectedExpiry = null;
        });

        document.getElementById('btn-grant-premium').addEventListener('click', async () => {
            if (!selectedUserId) return;
            
            const customDate = document.getElementById('prem-custom-date').value;
            const customTime = document.getElementById('prem-custom-time').value;
            
            let expiry = selectedExpiry;
            let plan = "Custom";

            if (customDate) {
                expiry = new Date(`${customDate}T${customTime || '00:00'}`);
                if (isNaN(expiry.getTime())) {
                    toast("Invalid custom date/time", "error");
                    return;
                }
            }

            if (expiry === 'lifetime') {
                await updateDoc(doc(db, 'users', selectedUserId), {
                    isPremium: true,
                    premiumPlan: 'Lifetime',
                    premiumExpiry: null,
                    premiumStart: serverTimestamp(),
                    premiumStatus: 'active'
                });
            } else if (expiry) {
                await updateDoc(doc(db, 'users', selectedUserId), {
                    isPremium: true,
                    premiumPlan: 'Admin Grant',
                    premiumExpiry: expiry,
                    premiumStart: serverTimestamp(),
                    premiumStatus: 'active'
                });
            } else {
                toast("Specify duration or custom expiry", "error");
                return;
            }

            toast("Access elevated", "success");
            closeModal();
        });

        // RESOURCE ACTIONS
        document.getElementById('upload-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('up-title').value;
            const cat = document.getElementById('up-category').value;
            const classLevel = document.getElementById('up-class').value;
            const subject = document.getElementById('up-subject').value;
            const pdf = document.getElementById('up-pdf').value;
            const thumb = document.getElementById('up-thumb').value;
            const desc = document.getElementById('up-desc').value;

            if (!title || !pdf) return toast("Title and PDF are mandatory", "error");

            try {
                const id = Date.now().toString();
                await setDoc(doc(db, 'resources', id), {
                    title,
                    category: cat,
                    classLevel,
                    subject,
                    pdfUrl: pdf,
                    thumbnailUrl: thumb,
                    description: desc,
                    createdAt: serverTimestamp(),
                    viewCount: 0,
                    downloadCount: 0
                });
                toast("Asset ingested successfully", "success");
                e.target.reset();
            } catch (err) { toast(err.message, "error"); }
        });

        window.deleteResource = async (id) => {
            if (!confirm("Permanently purge this asset?")) return;
            try {
                await deleteDoc(doc(db, 'resources', id));
                toast("Asset purged", "success");
            } catch (err) { toast(err.message, "error"); }
        };

        // CATEGORY ACTIONS
        document.getElementById('add-cat').addEventListener('click', async () => {
            const name = document.getElementById('new-cat-name').value;
            if (!name) return;
            const id = name.toLowerCase().replace(/\s+/g, '-');
            try {
                await setDoc(doc(db, 'categories', id), { name });
                document.getElementById('new-cat-name').value = '';
                toast("Category node added", "success");
            } catch (err) { toast(err.message, "error"); }
        });

        window.deleteCategory = async (id) => {
            if (!confirm("Purge category node?")) return;
            try {
                await deleteDoc(doc(db, 'categories', id));
                toast("Category purged", "success");
            } catch (err) { toast(err.message, "error"); }
        };

        // ANALYTICS RENDER
        function renderAnalytics() {
            const ctx = document.getElementById('retentionChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Day 1', 'Day 7', 'Day 14', 'Day 30'],
                    datasets: [{
                        label: 'Retention %',
                        data: [100, 65, 40, 25],
                        backgroundColor: '#0ea5e9',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true, max: 100 } }
                }
            });
        }

        // AI Management
        var assistantsData = [];

        async function loadAiStatus() {
            try {
                const docSnap = await getDoc(doc(db, 'ai_settings', 'status'));
                const enabled = docSnap.exists() ? docSnap.data().enabled : true;
                const btn = document.getElementById('toggle-ai-enabled');
                const text = document.getElementById('ai-status-text');
                
                if (btn && text) {
                    text.textContent = enabled ? 'Enabled' : 'Disabled';
                    btn.className = `px-6 py-3 ${enabled ? 'bg-green-500' : 'bg-red-500'} text-secondary rounded-lg font-bold hover:brightness-110`;
                }
                
                // Load Assistants
                const assistantsSnap = await getDocs(collection(db, 'ai_assistants'));
                assistantsData = assistantsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                renderAssistants();
            } catch (e) { console.error(e); }
        }

        function renderAssistants() {
            const container = document.getElementById('assistants-container');
            if (!container) return;
            container.innerHTML = assistantsData.map((a, index) => `
                <div class="border border-white/10 rounded-xl p-5 bg-black shadow-sm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">AI Name</label>
                            <input type="text" value="${a.name || ''}" class="w-full bg-surface border border-white/10 rounded-lg p-2 assistant-name" data-index="${index}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">API Key</label>
                            <input type="password" value="${a.apiKey || ''}" class="w-full bg-surface border border-white/10 rounded-lg p-2 assistant-key" data-index="${index}" placeholder="•••••••••••••••••••">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Provider</label>
                            <input type="text" value="${a.provider || ''}" class="w-full bg-surface border border-white/10 rounded-lg p-2 assistant-provider" data-index="${index}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Model Name/ID</label>
                            <input type="text" value="${a.model || ''}" class="w-full bg-surface border border-white/10 rounded-lg p-2 assistant-model" data-index="${index}">
                        </div>
                    </div>
                    <div class="flex items-center gap-2 pt-4 border-t border-white/5 mt-4">
                        <select class="bg-surface border border-white/10 rounded-lg p-2 assistant-enabled" data-index="${index}">
                            <option value="true" ${a.enabled ? 'selected' : ''}>Enabled</option>
                            <option value="false" ${!a.enabled ? 'selected' : ''}>Disabled</option>
                        </select>
                        <button onclick="saveAssistant(${index})" class="flex items-center gap-2 bg-primary text-secondary px-4 py-2 rounded-lg font-bold hover:brightness-110">Save</button>
                        <button onclick="deleteAssistant('${a.id}', ${index})" class="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-500 hover:text-white">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        window.saveAssistant = async (index) => {
            const a = assistantsData[index];
            const name = document.querySelector(`.assistant-name[data-index="${index}"]`).value;
            const apiKey = document.querySelector(`.assistant-key[data-index="${index}"]`).value;
            const provider = document.querySelector(`.assistant-provider[data-index="${index}"]`).value;
            const model = document.querySelector(`.assistant-model[data-index="${index}"]`).value;
            const enabled = document.querySelector(`.assistant-enabled[data-index="${index}"]`).value === 'true';

            try {
                const data = { name, apiKey, provider, model, enabled };
                if (a.id) {
                    await updateDoc(doc(db, 'ai_assistants', a.id), data);
                } else {
                    await addDoc(collection(db, 'ai_assistants'), { ...data, createdAt: serverTimestamp() });
                }
                toast("Saved successfully", "success");
                loadAiStatus();
            } catch (e) { toast("Error saving: " + e.message, "error"); }
        };

        window.deleteAssistant = async (id, index) => {
            if (!confirm("Delete this assistant?")) return;
            try {
                if (id) await deleteDoc(doc(db, 'ai_assistants', id));
                assistantsData.splice(index, 1);
                renderAssistants();
                toast("Deleted", "success");
            } catch (e) { toast("Error: " + e.message, "error"); }
        };

        // Consolidated Event Listeners
        function initEventListeners() {
        const togglePremiumBtn = document.getElementById('toggle-global-premium');
        if (togglePremiumBtn) {
            togglePremiumBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                if (!confirm(isChecked ? "Enable Global Free Premium?" : "Disable Global Free Premium?")) {
                    e.target.checked = !isChecked; // revert
                    return;
                }
                
                const statusSpan = document.getElementById('global-premium-status');
                statusSpan.textContent = 'Saving...';
                e.target.disabled = true;
                
                try {
                    const docRef = doc(db, 'website_control', 'settings');
                    await setDoc(docRef, { globalFreePremium: isChecked }, { merge: true });
                    statusSpan.textContent = isChecked ? 'ON' : 'OFF';
                    
                    if (isChecked) {
                        toast('Global Free Premium enabled! Granting to all eligible users...', 'info');
                        const usersSnap = await getDocs(collection(db, 'users'));
                        const now = new Date();
                        const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                        
                        let count = 0;
                        for (const userDoc of usersSnap.docs) {
                            const userData = userDoc.data();
                            
                            const hasActivePremium = userData.isPremium && (userData.premiumPlan === 'Lifetime' || userData.premiumType === 'Lifetime' || ((userData.premiumExpiry || userData.premiumExpiryDate) && (userData.premiumExpiry || userData.premiumExpiryDate).toDate() > now));
                            
                            if (!hasActivePremium) {
                                await updateDoc(userDoc.ref, {
                                    isPremium: true,
                                    premiumType: 'global_free',
                                    premiumStartDate: Timestamp.fromDate(now),
                                    premiumExpiryDate: Timestamp.fromDate(expiry),
                                    premiumStatus: 'active',
                                    premiumNotificationShown: false
                                });
                                count++;
                            }
                        }
                        toast("Granted Premium to " + count + " users", "success");
                    } else {
                        toast('Global Free Premium set to OFF', 'success');
                    }
                } catch (err) {
                    console.error("Error updating Global Free Premium:", err);
                    toast('Error updating Global Free Premium', 'error');
                    e.target.checked = !isChecked; // revert on error
                    statusSpan.textContent = !isChecked ? 'ON' : 'OFF';
                } finally {
                    e.target.disabled = false;
                }
            });
        }

            // AI Management
            const toggleAiBtn = document.getElementById('toggle-ai-enabled');
            if (toggleAiBtn) {
                toggleAiBtn.addEventListener('click', async () => {
                    const docRef = doc(db, 'ai_settings', 'status');
                    const docSnap = await getDoc(docRef);
                    const newEnabled = !(docSnap.exists() ? docSnap.data().enabled : true);
                    await setDoc(docRef, { enabled: newEnabled });
                    loadAiStatus();
                });
            }

            const addAssistantBtn = document.getElementById('add-assistant-btn');
            if (addAssistantBtn) {
                addAssistantBtn.addEventListener('click', () => {
                    assistantsData.push({ name: '', apiKey: '', provider: '', model: '', enabled: true });
                    renderAssistants();
                });
            }
            
            // Other Listeners...
        }




        // Search Handlers
        document.getElementById('user-search').addEventListener('input', updateUsersTable);
        document.getElementById('res-search').addEventListener('input', updateResourcesList);
        document.getElementById('refresh-users').addEventListener('click', updateUsersTable);

        // Mobile Menu Toggle Logic
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const closeSidebarBtn = document.getElementById('close-sidebar-btn');

        function toggleSidebar() {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        }

        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

        // Close sidebar when a tab is clicked on mobile
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    toggleSidebar();
                }
            });
        });

        // Service Worker Registration for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/admin-sw.js').then(registration => {
                    console.log('PWA ServiceWorker registered with scope:', registration.scope);
                }).catch(err => {
                    console.error('PWA ServiceWorker registration failed:', err);
                });
            });
        }
    </script>
</body>
</html>
