document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const moreButton = document.querySelector('.more-button');
    const moreMenu = document.getElementById('moreMenu');
    const selectOrderBtn = document.getElementById('selectOrder');
    const orderModal = document.getElementById('orderModal');

    // 获取发送图片相关的DOM元素
    const sendImageBtn = document.getElementById('sendImage');
    const imageInput = document.getElementById('imageInput');

    // 定义服务状态对象
    const serviceState = {
        isAI: true,
        currentAgentId: 'AI001'
    };

    // 修改服务信息对象
    const serviceInfo = {
        robotName: '智能客服',
        humanName: '在线客服',
        robotId: 'AI001',
        humanId: 'KF8888',
        robotAvatar: 'https://s1.imagehub.cc/images/2024/11/06/d7a00d349a2039159224eeac90e7f067.png',
        humanAvatar: 'https://s1.imagehub.cc/images/2024/11/06/ddb31bb09e40db6637ddcddfe8452c7c.jpeg',
        userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=user'
    };

    // 定义全局变量
    let transferKeywordCount = 0;

    // 在文件开头添加评分记录对象
    const ratingHistory = {
        ratings: {},  // 存储评分记录
        
        // 检查是否可以评分
        canRate(agentId) {
            const lastRating = this.ratings[agentId];
            if (!lastRating) return true;
            
            const now = new Date().getTime();
            const hoursDiff = (now - lastRating) / (1000 * 60 * 60);
            return hoursDiff >= 24;
        },
        
        // 记录评分时间
        recordRating(agentId) {
            this.ratings[agentId] = new Date().getTime();
        }
    };

    // 添加机器人回复规则
    const botResponses = {
        // 常见问候语
        greetings: {
            keywords: ['你好', '在吗', '在么', 'hi', 'hello', '您好'],
            responses: [
                '您好，我是智能助理小程，很高兴为您服务~',
                '您好，请问有什么可以帮您的吗？',
                '您好，我是24小时智能客服，请问有什么需要帮助的吗？'
            ]
        },
        // 订单相关
        order: {
            keywords: ['订单', '预订', '预定', '下单', '购买'],
            responses: [
                '您可以点击左下角"+"按钮，选择"选择订单"来查看您的订单信息~',
                '建议您先选择具体订单，这样我可以更好地为您服务哦~'
            ]
        },
        // 转人工相关
        transfer: {
            keywords: ['人工', '客服', '转接', '转人工'],
            responses: [
                '请您不要着急，您遇到的问题我可以随时为您处理哦~'
            ]
        },
        // 投诉相关
        complaint: {
            keywords: ['投诉', '不满意', '差评', '垃圾', '退款', '举报', '骗子'],
            responses: [
                '非常抱歉给您带来了不好的体验，智能助理现在为您转接人工客服，请稍后...'
            ]
        },
        // 添加退款相关规则
        refund: {
            keywords: ['退款'],
            responses: [
                '请您稍等，我为您调取订单信息...'
            ]
        },
        // 默认回复
        default: [
            '抱歉，我可能没有理解您的问题。您可以换个方式描述，或者再次输入"人工"来转接人工客服~',
            '您的问题我理解的不是很清楚，建议您可以选择订单，或者输入"转人工"来转接人工客服~'
        ]
    };

    // 添加消息函数
    function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        // 根据消息类型和当前服务状态选择头像
        const avatarSrc = type === 'service' 
            ? (serviceState.isAI ? serviceInfo.robotAvatar : serviceInfo.humanAvatar)
            : serviceInfo.userAvatar;
        
        // 根据消息类型创建不同的HTML结构
        if (type === 'user') {
            // 用户消息：内容在前，头像在后
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${content}
                    <div class="message-time">${formatTime()}</div>
                </div>
                <div class="avatar">
                    <img src="${avatarSrc}" alt="用户头像">
                </div>
            `;
        } else {
            // 客服消息：头像在前，内容在后
            messageDiv.innerHTML = `
                <div class="avatar">
                    <img src="${avatarSrc}" alt="客服头像">
                </div>
                <div class="message-content">
                    ${content}
                    <div class="message-time">${formatTime()}</div>
                </div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 格式化时间函数
    function formatTime() {
        return new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // 修改更新服务信息函数
    function updateServiceInfo(isHuman) {
        const serviceAvatar = document.getElementById('serviceAvatar');
        const serviceName = document.querySelector('.service-name');
        const serviceId = document.querySelector('.service-id');

        if (isHuman) {
            serviceAvatar.src = serviceInfo.humanAvatar;
            serviceId.textContent = `工号：${serviceState.currentAgentId}`;
            serviceName.textContent = serviceInfo.humanName;
        } else {
            serviceAvatar.src = serviceInfo.robotAvatar;
            serviceId.textContent = serviceInfo.robotName;
            serviceName.textContent = '万程乐娱';
        }
    }

    // 添加结束服务按钮显示控制函数
    function updateEndServiceButtonVisibility() {
        const endServiceBtn = document.getElementById('endService');
        if (endServiceBtn) {
            if (serviceState.isAI) {
                // 机器人模式下隐藏结束服务按钮
                endServiceBtn.style.display = 'none';
            } else {
                // 人工客服式下显示结束服务按
                endServiceBtn.style.display = 'flex';
            }
        }
    }

    // 修改转人工函数，添加按钮显示控制
    function handleTransferToHuman() {
        serviceState.isAI = false;
        serviceState.currentAgentId = '12001';
        updateServiceInfo(true);
        
        addMessage("正在为您转接人工客服，请稍候...", 'service');
        
        setTimeout(() => {
            addMessage(`您好，工号：${serviceState.currentAgentId}为您服务~`, 'service');
            // 显示结束服务按钮
            updateEndServiceButtonVisibility();
        }, 1500);
    }

    // 修改结束服务处理函数，添加按钮显示控制
    function handleEndService() {
        if (!ratingHistory.canRate(serviceState.currentAgentId)) {
            showAlert('您已对该客服进行过评价，24小时内仅可评价一次。');
            resetServiceState();
            return;
        }

        if (serviceState.isAI) {
            // 机器人模式结束
            addMessage('我是智能AI助理万小程，非谢���可，如您还有其他问题可以随时找我哟~', 'service');
            resetServiceState();
        } else {
            // 人工客服模式结束
            addMessage('您已结束本次人工务如您后续遇到任何问题欢迎您随时咨询哦~', 'service');
            
            // 显示评分弹窗
            showRatingModal();
        }
    }

    // 修改评分弹窗函数
    function showRatingModal() {
        const ratingModal = document.createElement('div');
        ratingModal.className = 'rating-modal';
        ratingModal.innerHTML = `
            <div class="rating-modal-content">
                <div class="rating-modal-header">
                    <h3>服务评价</h3>
                </div>
                <div class="rating-modal-body">
                    <p>本次服务已结束，请您对工号【${serviceState.currentAgentId}】的服务进行评价，您的评价对我们非常重要~ 😊</p>
                    
                    <div class="rating-item">
                        <div class="rating-label">专业程度</div>
                        <div class="rating-stars-container">
                            <div class="rating-stars" data-type="professional">
                                <span class="star" data-rating="1">❤</span>
                                <span class="star" data-rating="2">❤</span>
                                <span class="star" data-rating="3">❤</span>
                                <span class="star" data-rating="4">❤</span>
                                <span class="star" data-rating="5">❤</span>
                            </div>
                            <div class="rating-text"></div>
                        </div>
                    </div>

                    <div class="rating-item">
                        <div class="rating-label">服务态度</div>
                        <div class="rating-stars-container">
                            <div class="rating-stars" data-type="attitude">
                                <span class="star" data-rating="1">❤</span>
                                <span class="star" data-rating="2">❤</span>
                                <span class="star" data-rating="3">❤</span>
                                <span class="star" data-rating="4">❤</span>
                                <span class="star" data-rating="5">❤</span>
                            </div>
                            <div class="rating-text"></div>
                        </div>
                    </div>

                    <div class="rating-item">
                        <div class="rating-label">响应时长</div>
                        <div class="rating-stars-container">
                            <div class="rating-stars" data-type="response">
                                <span class="star" data-rating="1">❤</span>
                                <span class="star" data-rating="2">❤</span>
                                <span class="star" data-rating="3">❤</span>
                                <span class="star" data-rating="4">❤</span>
                                <span class="star" data-rating="5">❤</span>
                            </div>
                            <div class="rating-text"></div>
                        </div>
                    </div>

                    <div class="rating-feedback">
                        <textarea placeholder="请输入您的意见和建议（选填）" rows="3"></textarea>
                    </div>

                    <button class="rating-submit-btn">完成</button>
                </div>
            </div>
        `;

        document.body.appendChild(ratingModal);

        // 记录每个维度的评分
        const ratings = {
            professional: 0,
            attitude: 0,
            response: 0
        };

        // 添加评分事件
        const ratingItems = ratingModal.querySelectorAll('.rating-item');
        const submitBtn = ratingModal.querySelector('.rating-submit-btn');

        ratingItems.forEach(item => {
            const stars = item.querySelectorAll('.star');
            const ratingType = item.querySelector('.rating-stars').dataset.type;

            stars.forEach(star => {
                star.addEventListener('click', function() {
                    const rating = parseInt(this.dataset.rating);
                    ratings[ratingType] = rating;

                    // 更新评分文本
                    const ratingTexts = {
                        1: '不满意',
                        2: '不满意',
                        3: '一般',
                        4: '满意',
                        5: '非常满意'
                    };

                    // 更新爱心显示
                    stars.forEach(s => {
                        if (s.dataset.rating <= rating) {
                            s.style.color = '#ff0000';
                            s.classList.add('selected');
                        } else {
                            s.style.color = '#ffb3b3';
                            s.classList.remove('selected');
                        }
                    });

                    // 显示评分文本
                    const ratingTextDiv = item.querySelector('.rating-text');
                    ratingTextDiv.textContent = ratingTexts[rating];
                    ratingTextDiv.style.display = 'inline-block';

                    // 检查是否所有维度都已评分
                    if (Object.values(ratings).every(r => r > 0)) {
                        submitBtn.classList.add('active');
                    }
                });

                // 添加悬停效果
                star.addEventListener('mouseover', function() {
                    const rating = this.dataset.rating;
                    stars.forEach(s => {
                        if (s.dataset.rating <= rating) {
                            s.style.color = '#ff0000';
                        }
                    });
                });

                star.addEventListener('mouseout', function() {
                    stars.forEach(s => {
                        if (!s.classList.contains('selected')) {
                            s.style.color = '#ffb3b3';
                        }
                    });
                });
            });
        });

        // 添加提交按钮事件
        submitBtn.addEventListener('click', function() {
            if (Object.values(ratings).every(r => r > 0)) {
                const feedback = ratingModal.querySelector('textarea').value;
                
                // 记录评分
                ratingHistory.recordRating(serviceState.currentAgentId);

                // 关闭弹窗
                ratingModal.remove();
                showAlert('感谢您的评价，如您有问题可以随时联系我们处理哟~');
                resetServiceState();
            } else {
                showAlert('请完成所有评项');
            }
        });
    }

    // 添加重置服务状态函数
    function resetServiceState() {
        serviceState.isAI = true;
        updateServiceInfo(false);
        updateEndServiceButtonVisibility();
        transferKeywordCount = 0;
    }

    // 添加提示框函数
    function showAlert(message) {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 2000;
            font-size: 14px;
            color: #333;
            text-align: center;
        `;
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 2000);
    }

    // 修改消息发送函，移除结束服务检测
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // 发送用消息
        addMessage(message, 'user');
        messageInput.value = '';

        if (serviceState.isAI) {
            // 检查是否是退款请求
            if (message.includes('退款')) {
                setTimeout(() => {
                    addMessage('请您稍等，我为您调取订单信息...', 'service');
                    setTimeout(() => {
                        handleOrderSelection();
                    }, 500);
                }, 500);
                return;
            }

            // 检查是否包含投诉关键词
            const complaintKeywords = botResponses.complaint.keywords;
            const isComplaint = complaintKeywords.some(keyword => message.includes(keyword));

            if (isComplaint) {
                // 如果是投诉，直接发送道歉消息并转人工
                setTimeout(() => {
                    addMessage('非常抱歉给您带来了不好的体验，智能助理现在为您转接人工客服，请稍后...', 'service');
                    setTimeout(() => {
                        handleTransferToHuman();
                    }, 1000);
                }, 500);
            } else {
                // 检查是否是转人工请求
                const transferKeywords = ['转人工', '人工', '客服'];
                const isTransferRequest = transferKeywords.some(keyword => message.includes(keyword));

                if (isTransferRequest) {
                    handleTransferRequest();
                } else {
                    handleBotResponse(message);
                }
            }
        }
    }

    // 处理转人工请求
    function handleTransferRequest() {
        transferKeywordCount++;
        if (transferKeywordCount >= 2) {
            setTimeout(() => {
                handleTransferToHuman();
                transferKeywordCount = 0;
            }, 500);
        } else {
            setTimeout(() => {
                addMessage('请您不要着急，您遇到的问题我可以随时为您处理哦~', 'service');
            }, 500);
        }
    }

    // 处理机器人回复
    function handleBotResponse(message) {
        setTimeout(() => {
            const response = findMatchingResponse(message);
            addMessage(response, 'service');
        }, 500);
        transferKeywordCount = 0;
    }

    // 查找匹配的回复
    function findMatchingResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        for (const category in botResponses) {
            if (category === 'default') continue;
            
            const rule = botResponses[category];
            if (rule.keywords && rule.keywords.some(keyword => lowerMessage.includes(keyword))) {
                return rule.responses[Math.floor(Math.random() * rule.responses.length)];
            }
        }
        
        return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
    }

    // 绑定事件
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 初始化
    serviceState.isAI = true;
    updateServiceInfo(false);

    // 点击更多按钮显示/隐藏菜单
    if (moreButton && moreMenu) {
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            moreMenu.classList.toggle('show');
        });

        // 点击其他区域关闭菜单
        document.addEventListener('click', () => {
            moreMenu.classList.remove('show');
        });

        // 阻止菜单内部点击事件冒泡
        moreMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 添加束服务按钮事件监听
    const endServiceBtn = document.getElementById('endService');
    if (endServiceBtn) {
        endServiceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEndService();
            moreMenu.classList.remove('show'); // 关闭更多菜单
        });
    }

    // 修改订单状态转换函数
    function getStatusTag(status) {
        let className = '';
        let text = '';
        
        switch(status) {
            case '已结束':
                className = 'completed';
                text = '已结束';
                break;
            case '已出行':
                className = 'in-progress';
                text = '已出行';
                break;
            case '待服务':
                className = 'waiting';
                text = '待服务';
                break;
            default:
                className = 'waiting';
                text = '待服务';
        }
        
        return `<span class="status-tag ${className}">${text}</span>`;
    }

    // 修改模拟订单数据，添加手机号码
    const mockOrders = {
        initialOrders: [
            {
                id: 'CW20240301003',
                name: '城市玩伴',
                price: '1999',
                date: '2024-03-25',
                purchaseDate: '2024-03-01',
                traveler: '王五',
                phone: '13800138000',  // 添加手机号码
                status: '待服务'
            },
            {
                id: 'CW20240301002',
                name: '城市玩伴',
                price: '3999',
                date: '2024-03-20',
                purchaseDate: '2024-02-28',
                traveler: '李四',
                phone: '13800138001',  // 添加手机号码
                status: '已出行'
            },
            {
                id: 'CW20240301001',
                name: '城市玩伴',
                price: '2999',
                date: '2024-03-15',
                purchaseDate: '2024-02-25',
                traveler: '张三',
                phone: '13800138002',  // 添加手机号码
                status: '已结束'
            }
        ],
        moreOrders: [
            {
                id: 'CW20240301005',
                name: '城市玩伴',
                price: '3499',
                date: '2024-04-05',
                purchaseDate: '2024-02-20',
                traveler: '钱七',
                phone: '13800138003',  // 添加手机号码
                status: '已结束'
            },
            {
                id: 'CW20240301004',
                name: '城市玩伴',
                price: '2499',
                date: '2024-03-30',
                purchaseDate: '2024-02-15',
                traveler: '赵六',
                phone: '13800138004',  // 添加手机号码
                status: '待服务'
            }
        ]
    };

    // 修改订单项创建函数，添加手机号码显示
    function createOrderItem(order) {
        // 创建带星号的手机号码
        const maskedPhone = order.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div class="order-id">订单号：${order.id}</div>
            <div class="order-info">
                <div>产品：${order.name}</div>
                <div>价格：${order.price}元</div>
                <div>出行人：${order.traveler}</div>
                <div>手机号码：${maskedPhone}</div>
                <div>出行日期：${order.date}</div>
                <div>状态：${getStatusTag(order.status)}</div>
            </div>
            <button class="select-btn">选择</button>
        `;

        // 添加选择按钮点击事件
        const selectBtn = orderItem.querySelector('.select-btn');
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const orderModal = document.getElementById('orderModal');
            orderModal.classList.remove('show');
            
            // 发送订单信息到聊天手机号码带星号
            const orderMessage = `已选择订单：
订单号：${order.id}
产品：${order.name}
价格：${order.price}元
出行人：${order.traveler}
手机号码：${maskedPhone}
出行日期：${order.date}
状态：${order.status}`;

            addMessage(orderMessage, 'user');
            
            // 触发客服响应
            setTimeout(() => {
                handleOrderResponse(order);
            }, 500);
        });

        return orderItem;
    }

    // 修改订单选择处理函数，添加排序逻辑
    function handleOrderSelection() {
        const orderModal = document.getElementById('orderModal');
        const orderList = document.getElementById('orderList');
        const moreOrdersBtn = document.querySelector('.more-orders-btn');
        let hasLoadedMore = false;
        let allOrders = [...mockOrders.initialOrders];

        // 按购日期排序（最新的在前）
        function sortOrdersByDate(orders) {
            return orders.sort((a, b) => {
                return new Date(b.purchaseDate) - new Date(a.purchaseDate);
            });
        }

        // 清空现有订单列表
        orderList.innerHTML = '';
        
        // 添加排序后的初始订单
        const sortedInitialOrders = sortOrdersByDate(allOrders);
        sortedInitialOrders.forEach(order => {
            const orderItem = createOrderItem(order);
            orderList.appendChild(orderItem);
        });

        // 显示弹窗
        orderModal.classList.add('show');

        // 处理加载更多订单
        moreOrdersBtn.addEventListener('click', function() {
            if (!hasLoadedMore) {
                // 合并并排序所有订单
                allOrders = [...allOrders, ...mockOrders.moreOrders];
                const sortedAllOrders = sortOrdersByDate(allOrders);
                
                // 清空现有列表并重新添加所有排序后的订单
                orderList.innerHTML = '';
                sortedAllOrders.forEach(order => {
                    const orderItem = createOrderItem(order);
                    orderList.appendChild(orderItem);
                });
                
                hasLoadedMore = true;
                this.style.display = 'none'; // 隐藏按钮
            }
        });

        // 添加关闭按钮事件
        const closeBtn = orderModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            orderModal.classList.remove('show');
        });

        // 击弹窗外部关闭
        orderModal.addEventListener('click', (e) => {
            if (e.target === orderModal) {
                orderModal.classList.remove('show');
            }
        });
    }

    // 修改选择订单按钮的事件监听
    if (selectOrderBtn) {
        selectOrderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击选择订单按钮');
            
            // 显示订单弹窗
            const orderList = document.getElementById('orderList');
            orderList.innerHTML = ''; // 清空现有订单列表
            
            // 添加初始订单
            mockOrders.initialOrders.forEach(order => {
                const orderItem = createOrderItem(order);
                orderList.appendChild(orderItem);
            });
            
            // 显示弹窗
            orderModal.classList.add('show');
            moreMenu.classList.remove('show'); // 关闭更多菜单
        });
    }

    // 添加关闭按钮事件
    const closeModalBtn = orderModal.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            orderModal.classList.remove('show');
        });
    }

    // 点击弹窗外部关闭
    orderModal.addEventListener('click', function(e) {
        if (e.target === orderModal) {
            orderModal.classList.remove('show');
        }
    });

    // 修改手机号码验证函数
    function verifyPhoneNumber(phoneNumber, selectedOrder) {
        // 检查输入的手机号码是否匹配订单手机号码
        if (phoneNumber === selectedOrder.phone) {
            // 号码匹配，不发送消息，直接禁用输入框和按钮
            return true;
        } else {
            // 号码不匹配，显示弹窗提示
            showAlert('您输入的预订手机号码有误，请您输入正确的预订手机号码');
            return false;
        }
    }

    // 修改手机号码输入消息创建函数
    function createPhoneInputMessage(selectedOrder) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message service';
        
        // 创建头像
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.innerHTML = `<img src="${serviceState.isAI ? serviceInfo.robotAvatar : serviceInfo.humanAvatar}" alt="客服头像">`;
        
        // 创建消息内容
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content phone-input-message';
        contentDiv.innerHTML = `
            <div>为了保障用户隐私，请您办理业务前请输入您的预订手机号码，非常感谢您的配合</div>
            <div class="phone-input-container">
                <input type="tel" class="phone-input" placeholder="请输入手机号码" maxlength="11" pattern="[0-9]*">
                <button class="phone-submit-btn">完成</button>
            </div>
            <div class="message-time">${formatTime()}</div>
        `;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        // 添加手机号码输入和提交事件
        const phoneInput = contentDiv.querySelector('.phone-input');
        const submitBtn = contentDiv.querySelector('.phone-submit-btn');

        phoneInput.addEventListener('input', function(e) {
            // 只允许输入数字
            this.value = this.value.replace(/\D/g, '');
        });

        submitBtn.addEventListener('click', function() {
            const phoneNumber = phoneInput.value;
            
            // 验证手机号码
            if (!phoneNumber) {
                showAlert('请输入您的手机号码');
                return;
            }
            
            if (phoneNumber.length !== 11) {
                showAlert('您输入的手机号码格式不正确，请重新输入11位手机号码');
                phoneInput.value = '';
                return;
            }

            // 验证手机号码是否匹配订单
            if (verifyPhoneNumber(phoneNumber, selectedOrder)) {
                // 号码匹配，禁用输入和按钮
                phoneInput.disabled = true;
                submitBtn.disabled = true;
                submitBtn.style.backgroundColor = '#ccc';
            } else {
                // 号码不匹配，清空输入框
                phoneInput.value = '';
            }
        });

        return messageDiv;
    }

    // 修改订单响应处理函数
    function handleOrderResponse(order) {
        // 检查是否是退款场景且订单状态为已结束
        if (messageInput.value.includes('退款')) {
            if (order.status === '已结束') {
                const response = '您的订单已结束，已无法进行退款，非常抱歉给您带来了不便，还请您见谅~';
                addMessage(response, 'service');
            }
            return;  // 退款场景直接返回，不发送其他消息
        }

        // 延迟发送手机号码输入提示
        setTimeout(() => {
            const phoneMessage = createPhoneInputMessage(order);
            chatMessages.appendChild(phoneMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }

    // 获取时间问候语
    function getTimeGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            return '早上好';
        } else if (hour >= 12 && hour < 14) {
            return '中午好';
        } else if (hour >= 14 && hour < 18) {
            return '下午好';
        } else if (hour >= 18 && hour < 23) {
            return '晚上好';
        } else {
            return '深夜了';
        }
    }

    // 添加用户信息对象
    const userInfo = {
        name: "张三",
        level: "白金卡会员"
    };

    // 创建并添加反馈弹窗
    const ticketModal = document.createElement('div');
    ticketModal.className = 'ticket-modal';
    ticketModal.innerHTML = `
        <div class="ticket-modal-content">
            <div class="ticket-modal-header">
                <h3>反馈</h3>
                <button class="close-ticket-modal">×</button>
            </div>
            <div class="ticket-modal-body">
                <form class="feedback-form">
                    <div class="form-group">
                        <label>日期</label>
                        <input type="text" id="feedbackDate" readonly>
                    </div>
                    <div class="form-group">
                        <label>姓名</label>
                        <input type="text" id="feedbackName" placeholder="请输入姓名">
                    </div>
                    <div class="form-group">
                        <label>手机号码</label>
                        <input type="tel" id="feedbackPhone" placeholder="请输入手机号码" maxlength="11">
                    </div>
                    <div class="form-group">
                        <label>反馈内容</label>
                        <textarea id="feedbackContent" placeholder="请输入反馈内容" rows="4"></textarea>
                    </div>
                    <button type="submit" class="submit-btn">提交</button>
                </form>
            </div>
        </div>
    `;

    // 添加反馈弹窗到 body
    document.body.appendChild(ticketModal);

    // 获取反馈按钮
    const ticketBtn = document.getElementById('ticketBtn');

    // 添加反馈按钮点击事件
    if (ticketBtn) {
        ticketBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击反馈按钮');
            
            // 设置当前日期和时间
            const feedbackDate = document.getElementById('feedbackDate');
            if (feedbackDate) {
                const now = new Date();
                // 格式化日期和时间，精确到秒
                const dateStr = now.toLocaleDateString('zh-CN'); // 日期部分
                const timeStr = now.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                }); // 时间部分
                feedbackDate.value = `${dateStr} ${timeStr}`;
            }
            
            // 显示反馈弹窗
            ticketModal.classList.add('show');
        });
    }

    // 添加关闭按钮事件
    const closeBtn = ticketModal.querySelector('.close-ticket-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            ticketModal.classList.remove('show');
        });
    }

    // 点击弹窗外部关闭
    ticketModal.addEventListener('click', function(e) {
        if (e.target === ticketModal) {
            ticketModal.classList.remove('show');
        }
    });

    // 修改表单提交处理部分
    const feedbackForm = ticketModal.querySelector('.feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('feedbackName').value;
            const phone = document.getElementById('feedbackPhone').value;
            const content = document.getElementById('feedbackContent').value;

            // 创建提示弹窗
            function showFeedbackAlert(message) {
                const alertDiv = document.createElement('div');
                alertDiv.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    z-index: 2000;
                    font-size: 14px;
                    color: #333;
                    text-align: center;
                `;
                alertDiv.textContent = message;
                document.body.appendChild(alertDiv);

                // 2秒后自动移除提示
                setTimeout(() => {
                    alertDiv.remove();
                }, 2000);
            }

            // 表单验证
            if (!name) {
                showFeedbackAlert('请输入姓名');
                return;
            }
            if (!phone || phone.length !== 11) {
                showFeedbackAlert('请输入正确的手机号码');
                return;
            }
            if (!content) {
                showFeedbackAlert('请输入反馈内容');
                return;
            }

            // 提交成功后关闭弹窗
            ticketModal.classList.remove('show');
            
            // 清空表单
            feedbackForm.reset();
            
            // 显示提交成功提示
            showFeedbackAlert('感谢您的反馈，客服专员会尽快与您联系');
        });

        // 手机号码输入限制
        const phoneInput = document.getElementById('feedbackPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                this.value = this.value.replace(/\D/g, '');
            });
        }
    }

    // 在转人工时更新反馈按钮显示状态
    const originalHandleTransferToHuman = handleTransferToHuman;
    handleTransferToHuman = function() {
        originalHandleTransferToHuman.apply(this, arguments);
        updateTicketButtonVisibility();
    };

    // 在结束服务时新反馈按钮显示状态
    const originalHandleEndService = handleEndService;
    handleEndService = function() {
        originalHandleEndService.apply(this, arguments);
        updateTicketButtonVisibility();
    };

    // 添加发送图片按钮点击事件
    if (sendImageBtn) {
        sendImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击发送图片按钮');
            imageInput.click();  // 触发文件选择
            moreMenu.classList.remove('show');  // 关更多菜单
        });
    }

    // 处理图片选择
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            console.log('选择图片');
            const files = e.target.files;
            
            if (!files || files.length === 0) {
                console.log('没有选择文件');
                return;
            }

            // 处理每个选择的图片
            Array.from(files).forEach(file => {
                if (!file.type.startsWith('image/')) {
                    console.log('非图片文件:', file.type);
                    addMessage('请选择图片文件', 'service');
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = function(event) {
                    // 创建消息元素
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message user';
                    
                    // 创建消息容
                    messageDiv.innerHTML = `
                        <div class="message-content">
                            <img src="${event.target.result}" alt="发的图片" class="chat-image">
                            <div class="message-time">${formatTime()}</div>
                        </div>
                        <div class="avatar">
                            <img src="${serviceInfo.userAvatar}" alt="用户头像">
                        </div>
                    `;
                    
                    // 添加到聊天区域
                    chatMessages.appendChild(messageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                };
                
                reader.onerror = function(error) {
                    console.error('读取文件失败:', error);
                    addMessage('图片上传失败，请重试', 'service');
                };
                
                reader.readAsDataURL(file);
            });
            
            // 清空input，允许重复选择相同的图片
            e.target.value = '';
        });
    }

    // 添加关闭按钮事件
    const closeTicketBtn = ticketModal.querySelector('.close-ticket-modal');
    if (closeTicketBtn) {
        closeTicketBtn.addEventListener('click', function(e) {
            e.preventDefault();
            ticketModal.classList.remove('show');
        });
    }

    // 点击弹窗外部关闭
    ticketModal.addEventListener('click', function(e) {
        if (e.target === ticketModal) {
            ticketModal.classList.remove('show');
        }
    });

    // 初始化结束服务按钮状态
    updateEndServiceButtonVisibility();

    // 修改初始欢迎消息
    const welcomeMessage = `尊敬的${userInfo.name}${getTimeGreeting()}，您遇到了什么问题呢？让我来为您处理吧~ 😊

<div style="color: white; font-weight: bold;">💡 猜您想问：</div>
<div style="color: white; text-align: left;">
预订门票
预订城市玩伴
<span style="text-decoration: underline; cursor: pointer;" onclick="handleRefundClick()">退款问题</span>
</div>`;

    // 添加欢迎消息
    addMessage(welcomeMessage, 'service');

    // 添加退款点击处理函数
    function handleRefundClick() {
        // 发送退款消息
        addMessage('退款', 'user');
        
        // 触发退款处理流程
        setTimeout(() => {
            addMessage('请您稍等，我为您调取订单信息...', 'service');
            setTimeout(() => {
                handleOrderSelection();
            }, 500);
        }, 500);
    }

    // 将 handleRefundClick 函数添加到全局作用域
    window.handleRefundClick = handleRefundClick;
}); 