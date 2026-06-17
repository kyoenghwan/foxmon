import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 드림시큐리티 결과창은 application/x-www-form-urlencoded 형식의 POST로 데이터를 전달합니다.
    const formData = await req.formData();
    const dataString = formData.get('data') as string;

    if (!dataString) {
      return new NextResponse('Error: Missing data parameter', { status: 400 });
    }

    // dataString은 JSON 문자열입니다.
    let encryptMOKKeyToken = '';
    try {
      const resultObject = JSON.parse(dataString);
      encryptMOKKeyToken = resultObject.encryptMOKKeyToken || '';
    } catch (e) {
      // URL Encoding 되어 있을 가능성 대비
      try {
        const decoded = decodeURIComponent(dataString);
        const resultObject = JSON.parse(decoded);
        encryptMOKKeyToken = resultObject.encryptMOKKeyToken || '';
      } catch (err) {
        return new NextResponse('Error: Failed to parse data parameter', { status: 400 });
      }
    }

    if (!encryptMOKKeyToken) {
      return new NextResponse('Error: encryptMOKKeyToken is missing in response', { status: 400 });
    }

    // 부모 창(window.opener)의 콜백 함수 result()를 호출하고 팝업창을 닫는 HTML 리턴
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>본인확인 완료</title>
      </head>
      <body>
        <script>
          try {
            if (window.opener) {
              window.opener.result(JSON.stringify({
                success: true,
                encryptMOKKeyToken: ${JSON.stringify(encryptMOKKeyToken)}
              }));
            }
          } catch (e) {
            console.error('부모창 콜백 호출 오류:', e);
          } finally {
            window.close();
          }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: any) {
    return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
  }
}

// GET 요청이 올 경우 대비 (테스트 및 모의 확인용)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const encryptMOKKeyToken = searchParams.get('encryptMOKKeyToken');

    if (!encryptMOKKeyToken) {
      return new NextResponse('Error: Missing encryptMOKKeyToken in query string', { status: 400 });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>본인확인 완료 (Mock)</title>
      </head>
      <body>
        <script>
          try {
            if (window.opener) {
              window.opener.result(JSON.stringify({
                success: true,
                encryptMOKKeyToken: ${JSON.stringify(encryptMOKKeyToken)}
              }));
            }
          } catch (e) {
            console.error('부모창 콜백 호출 오류:', e);
          } finally {
            window.close();
          }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
  }
}
