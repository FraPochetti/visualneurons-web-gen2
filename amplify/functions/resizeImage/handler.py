import json
import base64
from io import BytesIO
from PIL import Image

def handler(event, context):
    try:
        # Parse the incoming request body as JSON.
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('imageBase64')
        if not image_base64:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing 'imageBase64' in request body"})
            }
        
        # Decode the base64 string into bytes.
        image_data = base64.b64decode(image_base64)
        with BytesIO(image_data) as input_buffer:
            with Image.open(input_buffer) as img:
                width, height = img.size
                print(f"Original image size: {width}x{height}")

                # Calculate new dimensions so that the smallest edge is 512 pixels.
                if width <= height:
                    new_width = 512
                    new_height = int(height * (512 / width))
                else:
                    new_height = 512
                    new_width = int(width * (512 / height))
                
                print(f"Resized image size: {new_width}x{new_height}")

                # Resize the image using a high-quality filter.
                resized_img = img.resize((new_width, new_height), Image.LANCZOS)

                # Save the resized image to an in-memory buffer in PNG format.
                output_buffer = BytesIO()
                resized_img.save(output_buffer, format='PNG')
                output_data = output_buffer.getvalue()
        
        # Encode the resized image back to a base64 string.
        resized_base64 = base64.b64encode(output_data).decode('utf-8')
        return {
            "statusCode": 200,
            "body": json.dumps({"imageBase64": resized_base64})
        }
    except Exception as e:
        print(f"Error during resize: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
