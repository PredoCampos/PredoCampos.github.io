(window.webpackJsonp=window.webpackJsonp||[]).push([[5],{140:function(t,e,n){"use strict";n.r(e);var o=n(0),r=n.n(o),i=n(4),a=n.n(i),l=n(212),c=(n(48),n(150),n(7)),s=n.n(c),p=(n(147),n(142)),d=n.n(p),u=n(151),f=n(144),m=n(141),h=n(143);function g(){var t=d()(["font-size: 40px;"]);return g=function(){return t},t}function b(){var t=d()(["font-size: 50px;"]);return b=function(){return t},t}function x(){var t=d()(["font-size: 60px;"]);return x=function(){return t},t}function v(){var t=d()(["font-size: 70px;"]);return v=function(){return t},t}function y(){var t=d()(["font-size: 40px;"]);return y=function(){return t},t}function w(){var t=d()(["font-size: 50px;"]);return w=function(){return t},t}function j(){var t=d()(["font-size: 60px;"]);return j=function(){return t},t}function _(){var t=d()(["font-size: 70px;"]);return _=function(){return t},t}function k(){var t=d()(["font-size: ",";"]);return k=function(){return t},t}function C(){var t=d()(["font-size: ",";"]);return C=function(){return t},t}function E(){var t=d()(["padding-top: 150px;"]);return E=function(){return t},t}var I=Object(m.b)(h.h).withConfig({displayName:"hero__HeroContainer",componentId:"u18tsz-0"})(["",";flex-direction:column;align-items:flex-start;min-height:100vh;",";div{width:100%;}"],h.k.flexCenter,h.j.tablet(E())),z=m.b.h1.withConfig({displayName:"hero__Hi",componentId:"u18tsz-1"})(["color:",";margin:0 0 20px 3px;font-size:",";font-family:",";font-weight:normal;",";",";"],h.l.colors.green,h.l.fontSizes.medium,h.l.fonts.SFMono,h.j.desktop(C(),h.l.fontSizes.small),h.j.tablet(k(),h.l.fontSizes.smallish)),N=m.b.h2.withConfig({displayName:"hero__Name",componentId:"u18tsz-2"})(["font-size:80px;line-height:1.1;margin:0;",";",";",";",";"],h.j.desktop(_()),h.j.tablet(j()),h.j.phablet(w()),h.j.phone(y())),S=m.b.h3.withConfig({displayName:"hero__Subtitle",componentId:"u18tsz-3"})(["font-size:80px;line-height:1.1;color:",";",";",";",";",";"],h.l.colors.slate,h.j.desktop(v()),h.j.tablet(x()),h.j.phablet(b()),h.j.phone(g())),q=m.b.div.withConfig({displayName:"hero__Blurb",componentId:"u18tsz-4"})(["margin-top:25px;width:50%;max-width:500px;a{",";}"],h.k.inlineLink),T=m.b.div.withConfig({displayName:"hero__EmailButton",componentId:"u18tsz-5"})([""]),O=Object(m.b)(h.a).withConfig({displayName:"hero__EmailLink",componentId:"u18tsz-6"})(["",";font-size:",";margin-top:50px;"],h.k.bigButton,h.l.fontSizes.smallish),M=function(t){function e(){for(var e,n=arguments.length,o=new Array(n),r=0;r<n;r++)o[r]=arguments[r];return(e=t.call.apply(t,[this].concat(o))||this).state={isMounted:!1},e}s()(e,t);var n=e.prototype;return n.componentDidMount=function(){var t=this;setTimeout(function(){return t.setState({isMounted:!0})},1e3)},n.render=function(){var t=this.props.data,e=this.state.isMounted,n=t[0].node,o=n.frontmatter,i=n.html,a=[function(){return r.a.createElement(z,{style:{transitionDelay:"100ms"}},o.title)},function(){return r.a.createElement(N,{style:{transitionDelay:"200ms"}},o.name,".")},function(){return r.a.createElement(S,{style:{transitionDelay:"300ms"}},o.subtitle)},function(){return r.a.createElement(q,{style:{transitionDelay:"400ms"},dangerouslySetInnerHTML:{__html:i}})},function(){return r.a.createElement(T,{style:{transitionDelay:"500ms"}},r.a.createElement(O,{href:"mailto:"+f.email},"Get In Touch"))}];return r.a.createElement(I,null,r.a.createElement(u.TransitionGroup,null,e&&a.map(function(t,e){return r.a.createElement(u.CSSTransition,{key:e,classNames:"fadeup",timeout:3e3},t)})))},e}(o.Component);M.propTypes={data:a.a.array.isRequired};var R=M,L=n(211),A=n.n(L),P=n(153);function F(){var t=d()(["width: 70%;"]);return F=function(){return t},t}function D(){var t=d()(["margin: 60px auto 0;"]);return D=function(){return t},t}function H(){var t=d()(["width: 100%;"]);return H=function(){return t},t}function B(){var t=d()(["display: block;"]);return B=function(){return t},t}var G=Object(m.b)(h.h).withConfig({displayName:"about__AboutContainer",componentId:"w43p1o-0"})(["position:relative;"]),W=m.b.div.withConfig({displayName:"about__FlexContainer",componentId:"w43p1o-1"})(["",";align-items:flex-start;",";"],h.k.flexBetween,h.j.tablet(B())),J=m.b.div.withConfig({displayName:"about__ContentContainer",componentId:"w43p1o-2"})(["width:60%;max-width:480px;",";a{",";}"],h.j.tablet(H()),h.k.inlineLink),Y=Object(m.b)(h.i).withConfig({displayName:"about__SkillsContainer",componentId:"w43p1o-3"})(["margin-top:20px;display:grid;overflow:hidden;grid-template-columns:repeat(2,minmax(140px,200px));"]),V=m.b.li.withConfig({displayName:"about__Skill",componentId:"w43p1o-4"})(["position:relative;margin-bottom:10px;padding-left:20px;font-family:",";font-size:",";color:",";&:before{content:'▹';position:absolute;left:0;color:",";font-size:",";line-height:12px;}"],h.l.fonts.SFMono,h.l.fontSizes.smallish,h.l.colors.slate,h.l.colors.green,h.l.fontSizes.small),X=m.b.div.withConfig({displayName:"about__PicContainer",componentId:"w43p1o-5"})(["position:relative;width:40%;max-width:300px;margin-left:60px;",";",";"],h.j.tablet(D()),h.j.phablet(F())),K=Object(m.b)(A.a).withConfig({displayName:"about__Avatar",componentId:"w43p1o-6"})(["width:100%;max-width:100%;vertical-align:middle;position:relative;mix-blend-mode:multiply;filter:grayscale(100%) contrast(1);border-radius:",";transition:",";"],h.l.borderRadius,h.l.transition),Q=m.b.div.withConfig({displayName:"about__AvatarContainer",componentId:"w43p1o-7"})(["width:100%;position:relative;border-radius:",";background-color:",";margin-left:-20px;&:hover,&:focus{background:transparent;&:after{top:15px;left:15px;}","{filter:none;mix-blend-mode:normal;}}&:before{content:'';position:absolute;width:100%;height:100%;top:0;left:0;right:0;bottom:0;transition:",";background-color:",";mix-blend-mode:screen;border-radius:",";}&:after{content:'';display:block;width:100%;height:100%;border:2px solid ",";position:absolute;top:20px;left:20px;z-index:-1;transition:",";border-radius:",";}"],h.l.borderRadius,h.l.colors.green,K,h.l.transition,h.l.colors.navy,h.l.borderRadius,h.l.colors.green,h.l.transition,h.l.borderRadius),U=function(t){function e(){return t.apply(this,arguments)||this}s()(e,t);var n=e.prototype;return n.componentDidMount=function(){Object(P.a)().reveal(this.about,Object(f.srConfig)())},n.render=function(){var t=this,e=this.props.data[0].node,n=e.frontmatter,o=e.html;return r.a.createElement(G,{id:"about",innerRef:function(e){return t.about=e}},r.a.createElement(h.c,null,n.title),r.a.createElement(W,null,r.a.createElement(J,null,r.a.createElement(h.g,{dangerouslySetInnerHTML:{__html:o}}),r.a.createElement(Y,null,n.skills&&n.skills.map(function(t,e){return r.a.createElement(V,{key:e},t)}))),r.a.createElement(X,null,r.a.createElement(Q,null,r.a.createElement(K,{fluid:n.avatar.childImageSharp.fluid,alt:"Avatar"})))))},e}(o.Component);U.propTypes={data:a.a.array.isRequired};var Z=U;n(149);function $(){var t=d()(["padding-left: 0;"]);return $=function(){return t},t}function tt(){var t=d()(["padding-left: 20px;"]);return tt=function(){return t},t}function et(){var t=d()(["\n    width: 100%;\n    max-width: ","px;\n    height: 2px;\n    top: auto;\n    bottom: 0;\n    transform: translateX(\n      ","px\n    );\n  "]);return et=function(){return t},t}function nt(){var t=d()(["\n    ",";\n    padding: 0 15px;\n    text-align: center;\n    border-left: 0;\n    border-bottom: 2px solid ",";\n    min-width: 120px;\n  "]);return nt=function(){return t},t}function ot(){var t=d()(["padding: 0 15px 2px;"]);return ot=function(){return t},t}function rt(){var t=d()(["\n    display: flex;\n    margin-bottom: 30px;\n    width: 100%;\n    overflow-x: scroll;\n  "]);return rt=function(){return t},t}function it(){var t=d()(["display: block;"]);return it=function(){return t},t}var at=Object(m.b)(h.h).withConfig({displayName:"jobs__JobsContainer",componentId:"sc-16t3gwe-0"})(["position:relative;max-width:700px;"]),lt=m.b.div.withConfig({displayName:"jobs__TabsContainer",componentId:"sc-16t3gwe-1"})(["display:flex;align-items:flex-start;position:relative;",";"],h.j.thone(it())),ct=m.b.div.withConfig({displayName:"jobs__Tabs",componentId:"sc-16t3gwe-2"})(["display:block;position:relative;width:max-content;z-index:3;",";"],h.j.thone(rt())),st=m.b.button.withConfig({displayName:"jobs__Tab",componentId:"sc-16t3gwe-3"})(["",";display:flex;align-items:center;width:100%;background-color:transparent;height:","px;padding:0 20px 2px;transition:",";border-left:2px solid ",";text-align:left;white-space:nowrap;font-family:",";font-size:",";color:",";",";",";&:hover,&:focus{background-color:",";}"],h.k.link,h.l.tabHeight,h.l.transition,h.l.colors.darkGrey,h.l.fonts.SFMono,h.l.fontSizes.smallish,function(t){return t.isActive?h.l.colors.green:h.l.colors.lightGrey},h.j.tablet(ot()),h.j.thone(nt(),h.k.flexCenter,h.l.colors.darkGrey),h.l.colors.lightNavy),pt=m.b.span.withConfig({displayName:"jobs__Highlighter",componentId:"sc-16t3gwe-4"})(["display:block;background:",";width:2px;height:","px;border-radius:",";position:absolute;top:0;left:0;transition:",";transition-delay:0.1s;z-index:10;transform:translateY( ","px );",";"],h.l.colors.green,h.l.tabHeight,h.l.borderRadius,h.l.transition,function(t){return t.activeTabId>0?t.activeTabId*h.l.tabHeight:0},h.j.thone(et(),h.l.tabWidth,function(t){return t.activeTabId>0?t.activeTabId*h.l.tabWidth:0})),dt=m.b.div.withConfig({displayName:"jobs__ContentContainer",componentId:"sc-16t3gwe-5"})(["position:relative;padding-top:14px;padding-left:30px;flex-grow:1;",";",";"],h.j.tablet(tt()),h.j.thone($())),ut=m.b.div.withConfig({displayName:"jobs__TabContent",componentId:"sc-16t3gwe-6"})(["top:0;left:0;width:100%;height:auto;opacity:",";z-index:",";position:",";visibility:",";transition:",";transition-duration:",";ul{padding:0;margin:0;list-style:none;font-size:",";li{position:relative;padding-left:30px;margin-bottom:5px;&:before{content:'▹';position:absolute;left:0;color:",";line-height:",";}}}a{",";}"],function(t){return t.isActive?1:0},function(t){return t.isActive?2:-1},function(t){return t.isActive?"relative":"absolute"},function(t){return t.isActive?"visible":"hidden"},h.l.transition,function(t){return t.isActive?"0.5s":"0s"},h.l.fontSizes.large,h.l.colors.green,h.l.fontSizes.xlarge,h.k.inlineLink),ft=m.b.h4.withConfig({displayName:"jobs__JobTitle",componentId:"sc-16t3gwe-7"})(["color:",";font-size:",";font-weight:500;margin-bottom:5px;"],h.l.colors.lightestSlate,h.l.fontSizes.xxlarge),mt=m.b.span.withConfig({displayName:"jobs__Company",componentId:"sc-16t3gwe-8"})(["color:",";"],h.l.colors.green),ht=m.b.h5.withConfig({displayName:"jobs__JobDetails",componentId:"sc-16t3gwe-9"})(["font-family:",";font-size:",";font-weight:normal;letter-spacing:0.5px;color:",";margin-bottom:30px;svg{width:15px;}"],h.l.fonts.SFMono,h.l.fontSizes.smallish,h.l.colors.lightSlate),gt=function(t){function e(){for(var e,n=arguments.length,o=new Array(n),r=0;r<n;r++)o[r]=arguments[r];return(e=t.call.apply(t,[this].concat(o))||this).state={activeTabId:0},e.isActive=function(t){return e.state.activeTabId===t},e.setActiveTab=function(t){return e.setState({activeTabId:t})},e}s()(e,t);var n=e.prototype;return n.componentDidMount=function(){Object(P.a)().reveal(this.jobs,Object(f.srConfig)())},n.render=function(){var t=this,e=this.state.activeTabId,n=this.props.data;return r.a.createElement(at,{id:"jobs",innerRef:function(e){return t.jobs=e}},r.a.createElement(h.c,null,"Where I've Worked"),r.a.createElement(lt,null,r.a.createElement(ct,{role:"tablist"},n&&n.map(function(e,n){var o=e.node;return r.a.createElement(st,{key:n,isActive:t.isActive(n),onClick:function(e){return t.setActiveTab(n,e)},role:"tab","aria-selected":t.isActive(n)?"true":"false","aria-controls":"tab"+n,id:"tab"+n,tabindex:t.isActive(n)?"0":"-1"},r.a.createElement("span",null,o.frontmatter.company))}),r.a.createElement(pt,{activeTabId:e})),r.a.createElement(dt,null,n&&n.map(function(e,n){var o=e.node;return r.a.createElement(ut,{key:n,isActive:t.isActive(n),id:"job"+n,role:"tabpanel",tabindex:"0","aria-labelledby":"job"+n,"aria-hidden":!t.isActive(n)},r.a.createElement(ft,null,r.a.createElement("span",null,o.frontmatter.title),r.a.createElement(mt,null," @ ",r.a.createElement("a",{href:o.frontmatter.url,target:"_blank",rel:"nofollow noopener noreferrer"},o.frontmatter.company))),r.a.createElement(ht,null,r.a.createElement("span",null,o.frontmatter.range)),r.a.createElement(h.g,{dangerouslySetInnerHTML:{__html:o.html}}))}))))},e}(o.Component);gt.propTypes={data:a.a.array.isRequired};var bt=gt,xt=(n(75),n(76),n(152));function vt(){var t=d()(["\n        grid-column: 1 / -1;\n        opacity: 0.25;\n      "]);return vt=function(){return t},t}function yt(){var t=d()(["height: 100%;"]);return yt=function(){return t},t}function wt(){var t=d()(["padding: 30px 25px 20px;"]);return wt=function(){return t},t}function jt(){var t=d()(["\n        grid-column: 1 / -1;\n        padding: 40px 40px 30px;\n      "]);return jt=function(){return t},t}function _t(){var t=d()(["margin-bottom: 70px;"]);return _t=function(){return t},t}function kt(){var t=d()(["\n    grid-column: 1 / -1;\n    opacity: 0.25;\n  "]);return kt=function(){return t},t}function Ct(){var t=d()(["height: 100%;"]);return Ct=function(){return t},t}function Et(){var t=d()(["\n    object-fit: cover;\n    width: auto;\n    height: 100%;\n    filter: grayscale(100%) contrast(1) brightness(80%);\n  "]);return Et=function(){return t},t}function It(){var t=d()(["\n      color: ",";\n      margin-right: 10px;\n    "]);return It=function(){return t},t}function zt(){var t=d()(["\n    background-color: transparent;\n    padding: 20px 0;\n  "]);return zt=function(){return t},t}function Nt(){var t=d()(["display: block;"]);return Nt=function(){return t},t}function St(){var t=d()(["font-size: 24px;"]);return St=function(){return t},t}function qt(){var t=d()(["padding: 30px 25px 20px;"]);return qt=function(){return t},t}function Tt(){var t=d()(["\n    grid-column: 1 / -1;\n    padding: 40px 40px 30px;\n  "]);return Tt=function(){return t},t}var Ot=Object(m.b)(h.h).withConfig({displayName:"featured__FeaturedContainer",componentId:"tty05m-0"})(["",";flex-direction:column;align-items:flex-start;"],h.k.flexCenter),Mt=m.b.div.withConfig({displayName:"featured__FeaturedGrid",componentId:"tty05m-1"})(["position:relative;"]),Rt=m.b.div.withConfig({displayName:"featured__ContentContainer",componentId:"tty05m-2"})(["position:relative;z-index:2;grid-column:1 / 7;grid-row:1 / -1;",";",";"],h.j.thone(Tt()),h.j.phablet(qt())),Lt=m.b.h4.withConfig({displayName:"featured__FeaturedLabel",componentId:"tty05m-3"})(["font-size:",";font-weight:normal;color:",";font-family:",";margin-top:10px;padding-top:0;"],h.l.fontSizes.smallish,h.l.colors.green,h.l.fonts.SFMono),At=m.b.h5.withConfig({displayName:"featured__ProjectName",componentId:"tty05m-4"})(["font-size:28px;font-weight:600;margin:0 0 20px;color:",";",";a{",";}"],h.l.colors.lightestSlate,h.j.tablet(St()),h.j.tablet(Nt())),Pt=m.b.div.withConfig({displayName:"featured__ProjectDescription",componentId:"tty05m-5"})(["background-color:",";color:",";padding:20px;border-radius:",";font-size:17px;line-height:1.3;",";p{margin:0;}a{",";color:",";}"],h.l.colors.lightNavy,h.l.colors.lightSlate,h.l.borderRadius,h.j.thone(zt()),h.k.inlineLink,h.l.colors.white),Ft=Object(m.b)(h.i).withConfig({displayName:"featured__TechList",componentId:"tty05m-6"})(["display:flex;flex-wrap:wrap;margin:25px 0 10px;li{font-family:",";font-size:",";color:",";margin-right:",";margin-bottom:7px;white-space:nowrap;&:last-of-type{margin-right:0;}",";}"],h.l.fonts.SFMono,h.l.fontSizes.smallish,h.l.colors.lightSlate,h.l.margin,h.j.thone(It(),h.l.colors.lightestSlate)),Dt=m.b.div.withConfig({displayName:"featured__Links",componentId:"tty05m-7"})(["display:flex;align-items:center;position:relative;margin-top:10px;margin-left:-10px;a{padding:10px;svg{width:22px;height:22px;}}"]),Ht=Object(m.b)(A.a).withConfig({displayName:"featured__FeaturedImg",componentId:"tty05m-8"})(["width:100%;max-width:100%;vertical-align:middle;border-radius:",";position:relative;mix-blend-mode:multiply;filter:grayscale(100%) contrast(1) brightness(90%);",";}"],h.l.borderRadius,h.j.tablet(Et())),Bt=m.b.div.withConfig({displayName:"featured__ImgContainer",componentId:"tty05m-9"})(["position:relative;z-index:1;border-radius:",";background-color:",";border-radius:2px;grid-column:6 / -1;grid-row:1 / -1;transition:",";",";",";&:hover,&:focus{background:transparent;&:before,","{background:transparent;filter:none;}}&:before{content:'';position:absolute;width:100%;height:100%;top:0;left:0;right:0;bottom:0;z-index:3;transition:",";background-color:",";mix-blend-mode:screen;}"],h.l.borderRadius,h.l.colors.green,h.l.transition,h.j.tablet(Ct()),h.j.thone(kt()),Ht,h.l.transition,h.l.colors.navy),Gt=m.b.div.withConfig({displayName:"featured__Project",componentId:"tty05m-10"})(["display:grid;grid-gap:10px;grid-template-columns:repeat(12,1fr);align-items:center;margin-bottom:100px;",";&:last-of-type{margin-bottom:0;}&:nth-of-type(odd){","{grid-column:7 / -1;text-align:right;",";",";}","{justify-content:flex-end;li{margin-left:",";margin-right:0;}}","{justify-content:flex-end;margin-left:0;margin-right:-10px;}","{grid-column:1 / 8;",";",";}}"],h.j.thone(_t()),Rt,h.j.thone(jt()),h.j.phablet(wt()),Ft,h.l.margin,Dt,Bt,h.j.tablet(yt()),h.j.thone(vt())),Wt=function(t){function e(e){var n;return(n=t.call(this,e)||this).revealRefs=[],n}s()(e,t);var n=e.prototype;return n.componentDidMount=function(){Object(P.a)().reveal(this.featured,Object(f.srConfig)()),this.revealRefs.forEach(function(t){return Object(P.a)().reveal(t,Object(f.srConfig)())})},n.render=function(){var t=this,e=this.props.data;return r.a.createElement(Ot,{id:"projects"},r.a.createElement(h.c,{innerRef:function(e){return t.featured=e}},"Some Things I've Built"),r.a.createElement(Mt,null,e&&e.map(function(e,n){var o=e.node;return r.a.createElement(Gt,{key:n,innerRef:function(e){return t.revealRefs[n]=e}},r.a.createElement(Rt,null,r.a.createElement(Lt,null,"Featured Project"),r.a.createElement(At,null,o.frontmatter.external?r.a.createElement(h.a,{href:o.frontmatter.external,target:"_blank",rel:"nofollow noopener noreferrer","aria-label":"External Link"},o.frontmatter.title):o.frontmatter.title),r.a.createElement(Pt,{dangerouslySetInnerHTML:{__html:o.html}}),o.frontmatter.tech&&r.a.createElement(Ft,null,o.frontmatter.tech.map(function(t,e){return r.a.createElement("li",{key:e},t)})),r.a.createElement(Dt,null,o.frontmatter.github&&r.a.createElement(h.a,{href:o.frontmatter.github,target:"_blank",rel:"nofollow noopener noreferrer","aria-label":"Github Link"},r.a.createElement(xt.d,null)),o.frontmatter.external&&r.a.createElement(h.a,{href:o.frontmatter.external,target:"_blank",rel:"nofollow noopener noreferrer","aria-label":"External Link"},r.a.createElement(xt.b,null)))),r.a.createElement(Bt,null,r.a.createElement(Ht,{fluid:o.frontmatter.cover.childImageSharp.fluid})))})))},e}(o.Component);Wt.propTypes={data:a.a.array.isRequired};var Jt=Wt;n(77);function Yt(){var t=d()(["grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));"]);return Yt=function(){return t},t}function Vt(){var t=d()(["font-size: 24px;"]);return Vt=function(){return t},t}var Xt=Object(m.b)(h.h).withConfig({displayName:"projects__ProjectsContainer",componentId:"sc-1qqk23d-0"})(["",";flex-direction:column;align-items:flex-start;"],h.k.flexCenter),Kt=m.b.h4.withConfig({displayName:"projects__ProjectsTitle",componentId:"sc-1qqk23d-1"})(["margin:0 auto 50px;font-size:",";",";a{display:block;}"],h.l.fontSizes.h3,h.j.tablet(Vt())),Qt=m.b.div.withConfig({displayName:"projects__ProjectsGrid",componentId:"sc-1qqk23d-2"})([".projects{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));grid-gap:15px;position:relative;",";}"],h.j.desktop(Yt())),Ut=m.b.div.withConfig({displayName:"projects__ProjectInner",componentId:"sc-1qqk23d-3"})(["",";flex-direction:column;align-items:flex-start;position:relative;padding:25px;height:100%;border-radius:",";transition:",";background-color:",";"],h.k.flexBetween,h.l.borderRadius,h.l.transition,h.l.colors.lightNavy),Zt=m.b.div.withConfig({displayName:"projects__Project",componentId:"sc-1qqk23d-4"})(["transition:",";&:hover,&:focus{","{transform:translateY(-5px);box-shadow:0 2px 4px ",";box-shadow:0 19px 38px "," 0 15px 12px ",";}}"],h.l.transition,Ut,h.l.colors.shadowNavy,h.l.colors.darkestNavy,h.l.colors.shadowNavy),$t=m.b.div.withConfig({displayName:"projects__ProjectTop",componentId:"sc-1qqk23d-5"})([""]),te=m.b.div.withConfig({displayName:"projects__ProjectBottom",componentId:"sc-1qqk23d-6"})([""]),ee=m.b.div.withConfig({displayName:"projects__ProjectHeader",componentId:"sc-1qqk23d-7"})(["",";margin-bottom:30px;"],h.k.flexBetween),ne=m.b.div.withConfig({displayName:"projects__Folder",componentId:"sc-1qqk23d-8"})(["color:",";svg{width:40px;height:40px;}"],h.l.colors.green),oe=m.b.div.withConfig({displayName:"projects__Links",componentId:"sc-1qqk23d-9"})(["margin-right:-10px;color:",";"],h.l.colors.lightSlate),re=Object(m.b)(h.a).withConfig({displayName:"projects__IconLink",componentId:"sc-1qqk23d-10"})(["padding:10px;svg{width:22px;height:22px;}"]),ie=m.b.h5.withConfig({displayName:"projects__ProjectName",componentId:"sc-1qqk23d-11"})(["margin:0 0 10px;font-size:",";color:",";"],h.l.fontSizes.xxlarge,h.l.colors.lightestSlate),ae=Object(m.b)(h.a).withConfig({displayName:"projects__ProjectLink",componentId:"sc-1qqk23d-12"})([""]),le=m.b.div.withConfig({displayName:"projects__ProjectDescription",componentId:"sc-1qqk23d-13"})(["font-size:17px;line-height:1.25;a{",";}"],h.k.inlineLink),ce=Object(m.b)(h.i).withConfig({displayName:"projects__TechList",componentId:"sc-1qqk23d-14"})(["flex-grow:1;display:flex;align-items:flex-end;flex-wrap:wrap;margin-top:20px;li{font-family:",";font-size:",";color:",";line-height:2;margin-right:15px;&:last-of-type{margin-right:0;}}"],h.l.fonts.SFMono,h.l.fontSizes.xsmall,h.l.colors.lightSlate),se=Object(m.b)(h.b).withConfig({displayName:"projects__ShowMoreButton",componentId:"sc-1qqk23d-15"})(["",";margin:100px auto 0;"],h.k.bigButton),pe=function(t){function e(e){var n;return(n=t.call(this,e)||this).state={showMore:!1},n.showMoreToggle=function(){return n.setState({showMore:!n.state.showMore})},n.revealRefs=[],n.restRefs=[],n}s()(e,t);var n=e.prototype;return n.componentDidMount=function(){Object(P.a)().reveal(this.projects,Object(f.srConfig)()),this.revealRefs.forEach(function(t,e){return Object(P.a)().reveal(t,Object(f.srConfig)(100*e))})},n.render=function(){var t=this,e=this.state.showMore,n=this.props.data.filter(function(t){return"true"===t.node.frontmatter.show}),o=n.slice(0,6),i=e?n:o;return r.a.createElement(Xt,null,r.a.createElement(Kt,{innerRef:function(e){return t.projects=e}},"Other Projects"),r.a.createElement(Qt,null,r.a.createElement(u.TransitionGroup,{className:"projects"},i&&i.map(function(e,n){var o=e.node;return r.a.createElement(u.CSSTransition,{key:n,classNames:"fadeup",timeout:n>=6?300*(n-6):300,exit:!1},r.a.createElement(Zt,{key:n,innerRef:function(e){return t.revealRefs[n]=e},style:{transitionDelay:(n>=6?100*(n-6):0)+"ms"}},r.a.createElement(Ut,null,r.a.createElement($t,null,r.a.createElement(ee,null,r.a.createElement(ne,null,r.a.createElement(xt.c,null)),r.a.createElement(oe,null,o.frontmatter.github&&r.a.createElement(re,{href:o.frontmatter.github,target:"_blank",rel:"nofollow noopener noreferrer","aria-label":"Github Link"},r.a.createElement(xt.d,null)),o.frontmatter.external&&r.a.createElement(re,{href:o.frontmatter.external,target:"_blank",rel:"nofollow noopener noreferrer","aria-label":"External Link"},r.a.createElement(xt.b,null)))),r.a.createElement(ie,null,o.frontmatter.external?r.a.createElement(ae,{href:o.frontmatter.external,target:"_blank",rel:"nofollow noopener noreferrer","aria-label":"Visit Website"},o.frontmatter.title):o.frontmatter.title),r.a.createElement(le,{dangerouslySetInnerHTML:{__html:o.html}})),r.a.createElement(te,null,r.a.createElement(ce,null,o.frontmatter.tech.map(function(t,e){return r.a.createElement("li",{key:e},t)}))))))}))),r.a.createElement(se,{onClick:this.showMoreToggle},e?"Fewer":"More"," Projects"))},e}(o.Component);pe.propTypes={data:a.a.array.isRequired};var de=pe;function ue(){var t=d()(["font-size: 40px;"]);return ue=function(){return t},t}function fe(){var t=d()(["font-size: 50px;"]);return fe=function(){return t},t}function me(){var t=d()(["font-size: ",";"]);return me=function(){return t},t}function he(){var t=d()(["font-size: ",";"]);return he=function(){return t},t}var ge=Object(m.b)(h.h).withConfig({displayName:"contact__ContactContainer",componentId:"sc-1xpoeq5-0"})(["text-align:center;max-width:600px;margin:0 auto 100px;a{",";}"],h.k.inlineLink),be=Object(m.b)(h.c).withConfig({displayName:"contact__Header",componentId:"sc-1xpoeq5-1"})(["display:block;color:",";font-size:",";font-family:",";font-weight:normal;margin-bottom:20px;justify-content:center;",";&:before{bottom:0;font-size:",";",";}&:after{display:none;}"],h.l.colors.green,h.l.fontSizes.medium,h.l.fonts.SFMono,h.j.desktop(he(),h.l.fontSizes.small),h.l.fontSizes.small,h.j.desktop(me(),h.l.fontSizes.smallish)),xe=m.b.h4.withConfig({displayName:"contact__Title",componentId:"sc-1xpoeq5-2"})(["margin:0 0 20px;font-size:60px;",";",";"],h.j.desktop(fe()),h.j.tablet(ue())),ve=Object(m.b)(h.a).withConfig({displayName:"contact__EmailLink",componentId:"sc-1xpoeq5-3"})(["",";margin-top:50px;"],h.k.bigButton),ye=function(t){function e(){return t.apply(this,arguments)||this}s()(e,t);var n=e.prototype;return n.componentDidMount=function(){Object(P.a)().reveal(this.contact,Object(f.srConfig)())},n.render=function(){var t=this,e=this.props.data[0].node,n=e.frontmatter,o=e.html;return r.a.createElement(ge,{id:"contact",innerRef:function(e){return t.contact=e}},r.a.createElement(be,null,"What's Next?"),r.a.createElement(xe,null,n.title),r.a.createElement(h.g,{dangerouslySetInnerHTML:{__html:o}}),r.a.createElement(ve,{href:"mailto:"+f.email,target:"_blank",rel:"nofollow noopener noreferrer"},"Say Hello"))},e}(o.Component);ye.propTypes={data:a.a.array.isRequired};var we=ye;n.d(e,"query",function(){return ke});var je=Object(m.b)(h.d).withConfig({displayName:"pages__MainContainer",componentId:"sc-1ppsr5x-0"})(["",";counter-reset:section;"],h.k.sidePadding),_e=function(t){var e=t.data,n=t.location;return r.a.createElement(l.a,{location:n},r.a.createElement(je,{id:"content"},r.a.createElement(R,{data:e.hero.edges}),r.a.createElement(Z,{data:e.about.edges}),r.a.createElement(bt,{data:e.jobs.edges}),r.a.createElement(Jt,{data:e.featured.edges}),r.a.createElement(de,{data:e.projects.edges}),r.a.createElement(we,{data:e.contact.edges})))};_e.propTypes={data:a.a.object.isRequired,location:a.a.object};e.default=_e;var ke="1973967208"}}]);
//# sourceMappingURL=component---src-pages-index-js-9bbaffe265c7f7081573.js.map